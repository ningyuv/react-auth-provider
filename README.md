# react-auth-provider
A generic auth provider that can be used for auth control, based on `react-router-dom v6` and `@tanstack/react-query v4`.

# Dependencies

- react v18
- react-router-dom v6
- @tanstack/react-query v4

# Setup
```bash
npm i @ningyuv/react-auth-provider
```

# Usage
## declare types

- `User`: the type of your user object
- `LoginData`: the type of your login request data
- `RegisterData`: the type of your register request data

example:
```ts
type User = {
    id: number,
    userType: UserType,
    username: string,
    firstName: string,
    email: string,
    emailVerified: boolean
}

type LoginData = {
    username: string;
    password: string;
};

type RegisterData = {
    username: string,
    password: string,
    userType: UserType
}
```

## declare userApi and authApi

- UserApi is used to get login status, so it should implements following method
  - While user login status valid, the promise should resolve,
  - **else if login failed if should throw `UnauthorizedError`** (which exported by `react-auth-provider`),
  - else reject (or thrown).

```ts
interface UserApi<User> {
    profile(): Promise<User>;
}
```

- AuthApi is used to login/logout/register/changePassword requests, so it should implements following methods

```ts
// While success the promises should resolve, else reject (or thrown).
interface AuthApi<LoginData, RegisterData> {
    register(data: RegisterData): Promise<any>;
    login(data: LoginData): Promise<any>;
    logout(): Promise<any>;
    changePassword(newPassword: string): Promise<any>;
}
```

## create your auth context and provider

```tsx
// AppAuthProvider.tsx
const AuthContext = createContext<User, LoginData, RegisterData>()

export const AppAuthProvider = ({ children }: {
    children?: ReactNode,
}) => {
    return <AuthProvider context={AuthContext} authApi={authApi} userApi={userApi}>
        {children}
    </AuthProvider>
}

export const useAuth = () => useContext(AuthContext)
```

## use your auth provider in your app

### wrap your content with `QueryClientProvider` and `AppAuthProvider`
```tsx
// App.tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RouterProvider } from 'react-router-dom';
import { AppAuthProvider } from './AppAuthProvider';

const queryClient = new QueryClient()

function App() {
    return (
        <QueryClientProvider client={queryClient}>
            <AppAuthProvider>
                <RouterProvider router={router} />
            </AppAuthProvider>
        </QueryClientProvider>
    )
}
```

### use auth in your pages/components
```tsx
import { useAuth } from "./AppAuthProvider";

function Profile() {
    const { isAuthenticated: loggedIn, user } = useAuth()
    return (
        <>{loggedIn ? <InnerProfile user={user} /> : 'not logged in.'}</>
    )
}
```