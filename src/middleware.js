// // middleware.js
// import { NextResponse } from 'next/server';

// const protectedRoutes = [
//   '/board',
//   '/task/create',
//   '/task/update',
//   '/profile',
// ];

// const authRoutes = [
//   '/login',
//   '/register',
// ];

// const publicRoutes = [
//   '/',
// ];

// export function middleware(request) {
//   const { pathname } = request.nextUrl;

//   // Lấy token từ cookie hoặc localStorage (Next.js middleware chỉ đọc được cookie)
//   // Nếu bạn lưu token ở localStorage, cần chuyển sang cookie hoặc dùng session
//   const token = request.cookies.get('token')?.value;
//   const isAuthenticated = !!token;

//   // Kiểm tra route có cần bảo vệ không
//   const isProtectedRoute = protectedRoutes.some(route =>
//     pathname === route || pathname.startsWith(`${route}/`)
//   );

//   const isAuthRoute = authRoutes.some(route =>
//     pathname === route || pathname.startsWith(`${route}/`)
//   );

//   // Nếu chưa đăng nhập mà vào route cần bảo vệ -> chuyển về login
//   if (!isAuthenticated && isProtectedRoute) {
//     const loginUrl = new URL('/login', request.url);
//     loginUrl.searchParams.set('callbackUrl', pathname);
//     return NextResponse.redirect(loginUrl);
//   }

//   // Nếu đã đăng nhập mà vào login/register -> chuyển về task
//   if (isAuthenticated && isAuthRoute) {
//     return NextResponse.redirect(new URL('/task', request.url));
//   }

//   return NextResponse.next();
// }

// // Cấu hình middleware chạy cho những route nào
// export const config = {
//   matcher: [
//     '/((?!_next/static|_next/image|favicon.ico|public|api).*)',
//   ],
// };

// middleware.js
import { NextResponse } from "next/server";

const protectedRoutes = [
  "/board", // ✅ Board routes
  "/profile", // ✅ Profile
  "/team", // ✅ Team routes
  "/team/join", // ✅ Join team
];

const authRoutes = ["/login", "/register"];

const publicRoutes = ["/"];

export function middleware(request) {
  const { pathname } = request.nextUrl;

  // Lấy token từ cookie
  const token = request.cookies.get("token")?.value;
  const isAuthenticated = !!token;

  // Kiểm tra route có cần bảo vệ không
  const isProtectedRoute = protectedRoutes.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  );

  const isAuthRoute = authRoutes.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  );

  // Nếu chưa đăng nhập mà vào route cần bảo vệ -> chuyển về login
  if (!isAuthenticated && isProtectedRoute) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // ✅ SỬA: Nếu đã đăng nhập mà vào login/register -> chuyển về /board
  if (isAuthenticated && isAuthRoute) {
    return NextResponse.redirect(new URL("/board", request.url));
  }

  return NextResponse.next();
}

// Cấu hình middleware chạy cho những route nào
export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|public|api|_next/webpack-hmr).*)",
  ],
};
