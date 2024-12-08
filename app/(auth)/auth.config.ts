	import type { NextAuthConfig } from 'next-auth';

export const authConfig = {
  pages: {
    signIn: '/login',
    newUser: '/chat',
  },
  providers: [
    // added later in auth.ts since it requires bcrypt which is only compatible with Node.js
    // while this file is also used in non-Node.js environments
  ],
	debug: true,

  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
			const isHomePage = nextUrl.pathname === '/'
				const isOnChat = nextUrl.pathname.startsWith('/chat');
      const isOnRegister = nextUrl.pathname.startsWith('/register');
      const isOnLogin = nextUrl.pathname.startsWith('/login');
			if (isOnChat) {
				if (isLoggedIn) return true;
				return false; // Redirect unauthenticated users to login page
			}

      if (isLoggedIn && (isOnLogin || isOnRegister || isHomePage)) {
        return Response.redirect(new URL('/chat', nextUrl as unknown as URL));
      }

      return true;
    },
  },
} satisfies NextAuthConfig;
