import { Context, ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { AuthState } from "./AuthProvider";

function RequireAuthed<TU, TL, TR>({ redirectUrl, authState, children, context: userContext }: {
    context: Context<TU>,
    redirectUrl: string,
    authState: AuthState<TU, TL, TR>,
    children?: ReactNode
}) {
    const { isAuthenticated, user } = authState

    return isAuthenticated ?
        <userContext.Provider value={user}>{children}</userContext.Provider> :
        <Navigate to={redirectUrl} replace />
}

export default RequireAuthed;