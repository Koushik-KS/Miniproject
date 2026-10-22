
import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 80,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      maxlength: 254,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Enter a valid email address"],
    },

    phone: {
      type: String,
      trim: true,
      default: "",
      maxlength: 20,
    },

    passwordHash: {
      type: String,
      required: true,
      select: false,
    },

    // Store only the hash of the reset token.
    resetPasswordTokenHash: {
      type: String,
      default: undefined,
      select: false,
    },

    resetPasswordExpires: {
      type: Date,
      default: undefined,
      select: false,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

userSchema.set("toJSON", {
  transform(_document, returnedObject) {
    delete returnedObject.passwordHash;
    delete returnedObject.resetPasswordTokenHash;
    delete returnedObject.resetPasswordExpires;
    return returnedObject;
  },
});

const User = mongoose.model("User", userSchema);

export default User;
