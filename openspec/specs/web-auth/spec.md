# web-auth Specification

## Purpose
JWT-based authentication: login, token storage, protected routes, logout.

## Requirements

### Requirement: Login
The system MUST authenticate via POST /auth/login, store JWT, and redirect to /devices.

#### Scenario: Success
- GIVEN valid username and password
- WHEN form is submitted
- THEN JWT is stored in localStorage, user is redirected to /devices

#### Scenario: Failure
- GIVEN invalid credentials
- WHEN POST /auth/login returns 401
- THEN error "Invalid credentials" is displayed, user stays on /login

#### Scenario: Expired token
- GIVEN an expired JWT in storage
- WHEN any protected API call returns 401
- THEN token is cleared, user is redirected to /login

### Requirement: Protected Routes
The system MUST redirect unauthenticated users to /login for /devices, /events, /dashboards, /settings.

#### Scenario: No token
- GIVEN no token in storage
- WHEN user navigates to any protected route
- THEN redirect to /login

#### Scenario: Valid token
- GIVEN valid token in storage
- WHEN user navigates to protected route
- THEN page renders normally

### Requirement: Logout
The system MUST clear stored JWT and redirect to /login on logout.

#### Scenario: Logout action
- GIVEN an authenticated session
- WHEN user clicks "Logout"
- THEN token is removed from localStorage, user is redirected to /login

### Requirement: AuthContext
The system MUST expose auth state (token, isAuthenticated, login, logout) via React Context.

#### Scenario: Auth state available
- GIVEN AuthContext wraps the app
- WHEN any descendant calls useAuth()
- THEN it receives { token, isAuthenticated, login, logout }
