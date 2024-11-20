import { Schema, model, Types, InferSchemaType } from "mongoose";
import bcrypt from "bcrypt";

const UserSchema: Schema = new Schema(
	{
		first_name: { type: String, required: true },
		last_name: { type: String, required: true },
		email: { type: String, required: true, unique: true },
		google_id: { type: String, sparse: true, unique: true },
		p_n: { type: String, sparse: true, unique: true },
		profile_pic: { type: String },
		password: { type: String },
		jira_token: { type: String, default: "" },
		metadata: { type: Object },
		is_deleted: { type: Boolean, default: false },
	},
	{
		timestamps: true,
	}
);

UserSchema.pre("save", async function (next) {
	if (this.isModified("password") && this.password) {
		this.password = await bcrypt.hash(this.password, 10);
	}
	next();
});

UserSchema.methods.comparePassword = function (password: string) {
	return bcrypt.compare(password, this.password!);
};

UserSchema.index({ email: 1, is_deleted: 1 });
UserSchema.index({ google_id: 1, is_deleted: 1 }, { sparse: true });
UserSchema.index({ p_n: 1, is_deleted: 1 }, { sparse: true });

export type UserType = Omit<InferSchemaType<typeof UserSchema>, "_id"> & {
	_id?: Types.ObjectId;
};

export const UserModel = model<UserType>("user", UserSchema);
