export interface IUserCreation {
	first_name: { type: String; required: true };
	last_name: { type: String; required: true };
	email: { type: String; required: true };
	google_id?: { type: String };
	p_n?: { type: String };
	profile_pic?: { type: String };
	password?: { type: String };
	metadata?: Object;
}
