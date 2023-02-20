import { ReactNode } from "react"
import { Navigate } from "react-router-dom"
import { AuthState } from "./AuthProvider"

function RequireUnauthed<TU, TL, TR>({ redirectUrl, authState, children }: {
    redirectUrl: string,
    authState: AuthState<TU, TL, TR>,
    children: ReactNode
}) {
    const { isAuthenticated } = authState

    return isAuthenticated ?
        <Navigate to={redirectUrl} replace /> :
        <>{children}</>
}

export default RequireUnauthed;