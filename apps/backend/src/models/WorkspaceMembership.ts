import { Schema, model, type InferSchemaType } from 'mongoose';

const workspaceMembershipSchema = new Schema(
  {
    workspaceId: {
      type: Schema.Types.ObjectId,
      ref: 'Workspace',
      required: true,
      index: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    role: {
      type: String,
      enum: ['owner', 'editor', 'viewer'],
      required: true,
    },
    status: {
      type: String,
      enum: ['active', 'pending'],
      required: true,
      default: 'active',
    },
    inviteToken: {
      type: String,
      required: false,
    },
  },
  { timestamps: true },
);

workspaceMembershipSchema.index({ workspaceId: 1, userId: 1 }, { unique: true });

export type WorkspaceMembershipDoc = InferSchemaType<typeof workspaceMembershipSchema>;
export const WorkspaceMembership = model('WorkspaceMembership', workspaceMembershipSchema);
