export interface RegisterUserParams {
    email: string;
    password: string;
    name?: string;
}

export interface VerifyEmailResult {
    success: boolean;
    message: string;
    redirect?: string;
}

export interface RequestPasswordResetResult {
    success: boolean;
    message: string;
}

export interface ResetPasswordResult {
    success: boolean;
    message: string;
}

export interface DeleteAccountResult {
    success: boolean;
    message: string;
}