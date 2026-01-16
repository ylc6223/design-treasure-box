# Requirements Document

## Introduction

本文档定义了"设计百宝箱"应用的后台管理系统和用户评分功能的需求。该系统将允许管理员管理网站展示的资源内容，并允许已登录用户对资源进行评分。

## Glossary

- **System**: 设计百宝箱应用系统
- **Admin_Panel**: 后台管理面板，用于管理资源和用户
- **Auth_Service**: 认证服务，处理用户登录、注册和权限验证
- **Resource_Manager**: 资源管理器，处理资源的增删改查操作
- **Rating_Service**: 评分服务，处理用户评分的提交和计算
- **User**: 普通用户，可以浏览资源和提交评分
- **Admin**: 管理员用户，拥有管理资源和用户的权限
- **Resource**: 设计资源条目
- **User_Rating**: 用户提交的评分记录
- **Aggregated_Rating**: 聚合后的资源评分（多个用户评分的平均值）

## Requirements

### Requirement 1: 用户认证系统（OAuth）

**User Story:** 作为用户，我想要能够使用 Google 或 GitHub 账号登录，以便快速访问评分功能而无需创建新账号。

#### Acceptance Criteria

1. WHEN a user clicks "Sign in with Google", THE Auth_Service SHALL redirect to Google OAuth authorization page
2. WHEN a user clicks "Sign in with GitHub", THE Auth_Service SHALL redirect to GitHub OAuth authorization page
3. WHEN a user successfully authorizes via Google or GitHub, THE Auth_Service SHALL create or retrieve the user account and establish a session
4. WHEN a user's OAuth authorization fails, THE Auth_Service SHALL display an error message and allow retry
5. WHEN a user's session token is valid, THE System SHALL allow access to protected resources
6. WHEN a user's session token is expired or invalid, THE System SHALL require re-authentication
7. WHEN a user logs out, THE Auth_Service SHALL invalidate the session token and clear OAuth session data
8. WHEN a new user logs in via OAuth for the first time, THE System SHALL create a user profile with information from the OAuth provider

### Requirement 2: 用户角色和权限管理

**User Story:** 作为系统管理员，我想要能够区分普通用户和管理员，以便控制不同用户对系统功能的访问权限。

#### Acceptance Criteria

1. WHEN a user account is created, THE System SHALL assign a default role of "user"
2. WHEN an admin promotes a user, THE System SHALL update the user's role to "admin"
3. WHEN a user attempts to access admin-only features, THE System SHALL verify the user has admin role
4. IF a non-admin user attempts to access admin features, THEN THE System SHALL deny access and return an authorization error
5. WHEN an admin demotes another admin, THE System SHALL update the target user's role to "user"

### Requirement 3: 资源管理（管理员功能）

**User Story:** 作为管理员，我想要能够添加、编辑和删除资源，以便维护网站展示的内容质量。

#### Acceptance Criteria

1. WHEN an admin provides valid resource information, THE Resource_Manager SHALL create a new resource entry
2. WHEN an admin updates resource information, THE Resource_Manager SHALL validate and save the changes
3. WHEN an admin deletes a resource, THE Resource_Manager SHALL remove the resource and all associated user ratings
4. WHEN an admin uploads a resource screenshot, THE System SHALL validate the image format and size
5. WHEN resource data is invalid (missing required fields, invalid URLs), THE Resource_Manager SHALL reject the operation and return validation errors
6. WHEN a resource is created or updated, THE System SHALL validate that the categoryId exists

### Requirement 4: 用户评分提交

**User Story:** 作为已登录用户，我想要能够对资源进行评分，以便分享我对资源质量的看法。

#### Acceptance Criteria

1. WHEN a logged-in user submits a rating for a resource, THE Rating_Service SHALL save the user's rating
2. WHEN a user submits a rating with values outside 0-5 range, THE Rating_Service SHALL reject the rating
3. WHEN a user submits a rating for a resource they have already rated, THE Rating_Service SHALL update their existing rating
4. WHEN a user is not logged in and attempts to submit a rating, THE System SHALL require authentication
5. WHEN a rating is submitted, THE System SHALL validate all rating dimensions (overall, usability, aesthetics, updateFrequency, freeLevel)

### Requirement 5: 评分聚合和显示

**User Story:** 作为用户，我想要看到资源的综合评分，以便了解其他用户对该资源的整体评价。

#### Acceptance Criteria

1. WHEN multiple users rate a resource, THE Rating_Service SHALL calculate the average rating for each dimension
2. WHEN displaying a resource, THE System SHALL show both the aggregated rating and the number of user ratings
3. WHEN a user views a resource they have rated, THE System SHALL display their personal rating alongside the aggregated rating
4. WHEN a resource has no user ratings, THE System SHALL display the curator's default rating
5. WHEN calculating aggregated ratings, THE System SHALL round values to the nearest 0.5

### Requirement 6: 管理员面板界面

**User Story:** 作为管理员，我想要一个直观的管理界面，以便高效地管理资源和查看系统统计信息。

#### Acceptance Criteria

1. WHEN an admin accesses the admin panel, THE System SHALL display a dashboard with key statistics
2. WHEN an admin views the resource list, THE System SHALL display all resources with pagination and search functionality
3. WHEN an admin clicks on a resource, THE System SHALL display detailed information and editing options
4. WHEN an admin creates or edits a resource, THE System SHALL provide a form with validation feedback
5. WHEN an admin views user ratings, THE System SHALL display rating statistics and individual user ratings

### Requirement 7: 数据持久化

**User Story:** 作为系统架构师，我想要将用户数据和评分数据持久化存储，以便数据在应用重启后仍然可用。

#### Acceptance Criteria

1. WHEN user data is created or updated, THE System SHALL persist the data to a database
2. WHEN rating data is submitted, THE System SHALL persist the rating to a database
3. WHEN resource data is modified, THE System SHALL persist the changes to a database
4. WHEN the application starts, THE System SHALL load existing data from the database
5. WHEN database operations fail, THE System SHALL return appropriate error messages and maintain data consistency

### Requirement 8: API 端点设计

**User Story:** 作为前端开发者，我想要清晰定义的 API 端点，以便与后端服务进行交互。

#### Acceptance Criteria

1. THE System SHALL provide RESTful API endpoints for authentication operations (register, login, logout)
2. THE System SHALL provide RESTful API endpoints for resource management (CRUD operations)
3. THE System SHALL provide RESTful API endpoints for rating operations (submit, update, retrieve)
4. THE System SHALL provide RESTful API endpoints for user management (list, update roles)
5. WHEN API requests are made, THE System SHALL validate request authentication and authorization
6. WHEN API operations fail, THE System SHALL return appropriate HTTP status codes and error messages

### Requirement 9: 数据验证和安全

**User Story:** 作为系统管理员，我想要确保所有输入数据都经过验证，以便保护系统免受恶意输入和数据损坏。

#### Acceptance Criteria

1. WHEN user input is received, THE System SHALL validate data against defined schemas
2. WHEN passwords are stored, THE System SHALL hash passwords using a secure algorithm
3. WHEN API requests are made, THE System SHALL validate authentication tokens
4. WHEN file uploads are processed, THE System SHALL validate file types and sizes
5. WHEN SQL queries are executed, THE System SHALL use parameterized queries to prevent SQL injection
6. WHEN sensitive data is transmitted, THE System SHALL use HTTPS encryption

### Requirement 10: 前台用户界面集成

**User Story:** 作为用户，我想要在网站前台无缝访问登录和评分功能，以便在浏览资源时可以提交我的评分。

#### Acceptance Criteria

1. WHEN a user is not logged in, THE System SHALL display login/register buttons in the header
2. WHEN a user is logged in, THE System SHALL display user profile menu in the header
3. WHEN a user views a resource card or detail page, THE System SHALL display rating interface
4. WHEN a logged-in user views a resource, THE System SHALL show their existing rating if available
5. WHEN displaying rating stars, THE System SHALL use interactive components for logged-in users and read-only components for guests
6. WHEN a user clicks on rating stars, THE System SHALL open a rating dialog with all rating dimensions

### Requirement 11: 后台管理界面

**User Story:** 作为管理员，我想要通过独立的后台管理界面管理资源，以便与前台用户界面分离。

#### Acceptance Criteria

1. WHEN an admin accesses the admin panel URL (e.g., /admin), THE System SHALL verify admin authentication
2. IF a non-admin user attempts to access the admin panel, THEN THE System SHALL redirect to the login page
3. WHEN an admin is logged in to the admin panel, THE System SHALL display a separate admin layout with navigation
4. WHEN an admin views the admin dashboard, THE System SHALL display statistics and recent activities
5. WHEN an admin manages resources in the admin panel, THE System SHALL provide CRUD interfaces separate from the front-end
6. WHEN an admin logs out from the admin panel, THE System SHALL redirect to the front-end home page
