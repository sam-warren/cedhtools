import { toast } from "sonner";

type ApiError = {
    error: string;
    message?: string;
    type?: string;
};

/**
 * Redirect to login page with current URL as return path
 */
export function redirectToLogin() {
    const returnTo = encodeURIComponent(window.location.pathname + window.location.search);
    window.location.href = `/login?returnTo=${returnTo}`;
}

/**
 * Custom fetch wrapper that handles common API errors including authentication
 */
export async function fetchWithAuth<T>(
    url: string,
    options?: RequestInit
): Promise<T> {
    try {
        const response = await fetch(url, options);

        // If the response is not ok, try to parse the error
        if (!response.ok) {
            let errorData: ApiError;

            try {
                errorData = await response.json() as ApiError;
            } catch {
                // If we can't parse the JSON, create a basic error
                errorData = {
                    error: `HTTP Error ${response.status}`,
                    message: response.statusText
                };
            }

            // Handle authentication errors
            if (response.status === 401 ||
                errorData.error?.toLowerCase().includes('authentication') ||
                errorData.type === 'AUTH_REQUIRED') {
                // For auth errors, immediately redirect to login
                redirectToLogin();

                // Return a promise that never resolves to stop further execution
                return new Promise(() => { });
            } else if (errorData.type === 'UPGRADE_REQUIRED') {
                // Handle upgrade required errors
                toast.error(errorData.message || "Upgrade required", {
                    action: {
                        label: "Upgrade",
                        onClick: () => {
                            window.location.href = "/pricing";
                        },
                    },
                    duration: 5000,
                });
            } else {
                // Handle other errors
                toast.error(errorData.message || errorData.error || "An error occurred");
            }

            throw new Error(errorData.message || errorData.error || "API Error");
        }

        // Try to parse the response as JSON
        try {
            return await response.json() as T;
        } catch {
            // If it's not valid JSON, return null
            return null as unknown as T;
        }
    } catch (error) {
        console.error("API request failed:", error);
        throw error;
    }
} 