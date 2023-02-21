import { useQuery, useQueryClient, UseQueryOptions } from "@tanstack/react-query";
import { useState, ReactNode, Context } from "react";
import React from "react";

export type AuthState<TU, TL, TR> = {
    isFetching: boolean,
    invalidate: () => Promise<void>,
    login: (data: TL) => Promise<void>,
    register: (data: TR) => Promise<void>,
    changePassword: (newPassword: string) => Promise<void>,
    logout: () => Promise<void>,
} & ({
    isAuthenticated: true,
    user: TU
} | {
    isAuthenticated: false,
    user: undefined
})

export const createContext = <TU, TL, TR>() => {
    return React.createContext<AuthState<TU, TL, TR>>({
        isFetching: false, isAuthenticated: false, user: undefined, invalidate: async () => { },
        login: async () => { }, register: async () => { }, changePassword: async () => { }, logout: async () => { }
    })
}

interface AuthApi<TL, TR> {
    register(data: TR): Promise<any>;
    login(data: TL): Promise<any>;
    logout(): Promise<any>;
    changePassword(newPassword: string): Promise<any>;
}

interface UserApi<TU> {
    profile(): Promise<TU>;
}

export class UnauthorizedError extends Error {
    constructor(message: string) {
        super(message)
        this.name = 'UnauthorizedError'
    }
}

type AuthProviderProps<TU, TL, TR> = {
    context: Context<AuthState<TU, TL, TR>>,
    authApi: AuthApi<TL, TR>,
    userApi: UserApi<TU>,
    children?: ReactNode,
    loadingComponent?: ReactNode,

    /** custom tanstack query options.
     * see: https://tanstack.com/query/v4/docs/reference/useQuery
     * default: {
     *     queryKey: ['__profile'],
     *     enabled: true,
     *     retry: 3
     * }
     * 
     * retry will be forced stopped when thrown UnauthorizedError.
     * enabled will be forced false when user logged out,
     * and will not be forced false when user logged in, register succeed or invalidate() was called.
     */
    useQueryOptions?: Omit<UseQueryOptions<TU>, 'queryFn'>
}

export const AuthProvider = <TU, TL, TR>({
    context,
    authApi,
    userApi,
    children,
    loadingComponent,
    useQueryOptions
}: AuthProviderProps<TU, TL, TR>) => {
    const [fetchProfile, setFetchProfile] = useState(true)
    const queryClient = useQueryClient()
    const queryKey = useQueryOptions?.queryKey ?? ['__profile']
    const { isLoading, isFetching, isError, data } = useQuery({
        ...useQueryOptions,
        queryKey,
        queryFn: async () => {
            try {
                return await userApi.profile()
            } catch (error) {
                if (error instanceof UnauthorizedError) {
                    setFetchProfile(false)
                }
                throw error
            }
        },
        enabled: fetchProfile && (useQueryOptions?.enabled ?? true),
        retry: (failureCount, error) => {
            if (error instanceof UnauthorizedError) {
                return false
            }
            const retry = useQueryOptions?.retry ?? 3
            return retry === true ||
                (typeof retry === 'number' && failureCount < retry) ||
                (typeof retry === 'function' && retry(failureCount, error))
        }
    })
    const invalidate = async () => {
        await queryClient.invalidateQueries({ queryKey })
        setFetchProfile(true)
    }
    async function register(data: TR) {
        await authApi.register(data)
        await invalidate()
    }
    async function login(data: TL) {
        await authApi.login(data)
        await invalidate()
    }
    async function logout() {
        await authApi.logout()
        setFetchProfile(false)
    }
    async function changePassword(newPassword: string) {
        await authApi.changePassword(newPassword)
        await invalidate()
    }

    let value: AuthState<TU, TL, TR>
    value = {
        isFetching, isAuthenticated: false, user: undefined,
        invalidate, login, register, changePassword, logout
    }
    if (!isLoading && !isError && fetchProfile) {
        value = {
            ...value,
            isAuthenticated: true,
            user: data
        }
    }
    return (
        <>
            {isLoading ? loadingComponent || 'waiting...' : <context.Provider value={value}>
                {children}
            </context.Provider>}
        </>
    )
}
