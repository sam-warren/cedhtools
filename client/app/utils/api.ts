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
 * Custom fetch wrapper that handles common API errors without requiring authentication
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

            // Handle different error types
            if (errorData.type === 'AUTH_REQUIRED') {
                // Authentication is optional, but show a toast suggesting login
                toast.info("Sign in to save your analyses", {
                    action: {
                        label: "Sign In",
                        onClick: () => {
                            redirectToLogin();
                        },
                    },
                    duration: 5000,
                });
                
                // Continue with the response
                throw new Error(errorData.message || errorData.error || "Authentication suggested but not required");
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