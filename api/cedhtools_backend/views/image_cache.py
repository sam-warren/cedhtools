from django.urls import path
from typing import Any, Dict, Callable
import requests
from django.http import HttpResponse, HttpResponseBadRequest
from django.views.generic import View
from django.core.cache import cache
from django.utils.decorators import method_decorator
from django.views.decorators.cache import cache_page
from urllib.parse import unquote
import logging
import time
from functools import wraps

logger = logging.getLogger(__name__)


def rate_limit(key_prefix: str, limit: int = 100, period: int = 60):
    def decorator(func):
        def rate_limited_view(request, *args, **kwargs):
            key = f"{key_prefix}:{request.META.get('REMOTE_ADDR', 'unknown')}"
            now = time.time()
            count, timestamp = cache.get(key, (0, now))

            if now - timestamp > period:
                count = 0
                timestamp = now

            count += 1

            if count > limit:
                return HttpResponse(
                    'Rate limit exceeded',
                    status=429,
                    content_type='text/plain'
                )

            cache.set(key, (count, timestamp), period)
            return func(request, *args, **kwargs)

        return rate_limited_view
    return decorator


class ScryfallImageProxyView(View):
    ALLOWED_DOMAINS = ['cards.scryfall.io']
    TIMEOUT = 10
    CHUNK_SIZE = 8192
    FORWARDED_HEADERS = ['Content-Length', 'Cache-Control', 'Expires']

    def __init__(self, **kwargs: Any) -> None:
        super().__init__(**kwargs)
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'YourApp/1.0'
        })

    def validate_url(self, url: str) -> bool:
        try:
            return any(domain in url for domain in self.ALLOWED_DOMAINS)
        except Exception as e:
            logger.error(f'URL validation error: {e}')
            return False

    def get_proxy_response(self, response: requests.Response) -> HttpResponse:
        proxy_response = HttpResponse(
            response.iter_content(chunk_size=self.CHUNK_SIZE),
            content_type=response.headers.get('Content-Type')
        )

        for header in self.FORWARDED_HEADERS:
            if header in response.headers:
                proxy_response[header] = response.headers[header]

        proxy_response['Access-Control-Allow-Origin'] = '*'
        proxy_response['Access-Control-Allow-Methods'] = 'GET, OPTIONS'

        return proxy_response

    def handle_error(self, error: Exception, url: str) -> HttpResponse:
        logger.error(f'Proxy error for {url}: {str(error)}')

        if isinstance(error, requests.Timeout):
            status = 504
        elif isinstance(error, requests.ConnectionError):
            status = 502
        else:
            status = 500

        return HttpResponse(
            f'Failed to fetch image: {str(error)}',
            status=status,
            content_type='text/plain'
        )

    def get_handler(self, request, *args, **kwargs):
        image_url = request.GET.get('url')
        if not image_url:
            return HttpResponseBadRequest('URL parameter is required')

        image_url = unquote(image_url)

        if not self.validate_url(image_url):
            return HttpResponseBadRequest('Invalid URL domain')

        try:
            response = self.session.get(
                image_url,
                timeout=self.TIMEOUT,
                stream=True
            )
            response.raise_for_status()

            return self.get_proxy_response(response)

        except requests.RequestException as e:
            return self.handle_error(e, image_url)
        except Exception as e:
            logger.exception('Unexpected error in proxy view')
            return self.handle_error(e, image_url)

    @method_decorator(cache_page(60 * 60 * 24 * 30))
    # Allow 10 requests per second
    @method_decorator(rate_limit('scryfall_proxy', limit=10, period=1))
    def get(self, request, *args, **kwargs):
        return self.get_handler(request, *args, **kwargs)

    def options(self, request, *args: Any, **kwargs: Any) -> HttpResponse:
        response = HttpResponse()
        response['Allow'] = 'GET, OPTIONS'
        response['Access-Control-Allow-Origin'] = '*'
        response['Access-Control-Allow-Methods'] = 'GET, OPTIONS'
        response['Access-Control-Allow-Headers'] = 'Content-Type'
        return response
