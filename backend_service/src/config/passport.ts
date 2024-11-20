import "../config/envLoader.js";
import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { Strategy as JwtStrategy, ExtractJwt } from "passport-jwt";
import * as UsersService from "../users/user.service.js";

// Google Strategy
passport.use(
	new GoogleStrategy(
		{
			clientID: process.env.GOOGLE_CLIENT_ID as string,
			clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
			callbackURL: process.env.GOOGLE_CALLBACK_URL as string,
		},
		async (
			accessToken: string,
			refreshToken: string,
			profile: any,
			done: (error: any, user?: any, info?: any) => void
		) => {
			try {
				let user: any = await UsersService.getSingleUser({
					google_id: profile.id,
					is_deleted: false,
				});
				if (!user) {
					user = await UsersService.createUser({
						first_name: profile.name.givenName,
						last_name: profile.name.familyName,
						email: profile.emails[0].value,
						google_id: profile.id,
						profile_pic: profile?.photos?.[0]?.value,
					});
				}
				done(null, user);
			} catch (err) {
				done(err, false);
			}
		}
	)
);

// JWT Strategy
passport.use(
	new JwtStrategy(
		{
			jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
			secretOrKey: process.env.JWT_SECRET as string,
		},
		async (payload, done) => {
			try {
				const user = await UsersService.getSingleUser({
					_id: payload.id,
				});
				if (!user) {
					return done(null, false);
				}
				done(null, user);
			} catch (error) {
				done(error, false);
			}
		}
	)
);

export const passportConfig = passport;
