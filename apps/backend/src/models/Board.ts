import { Schema, model, type InferSchemaType } from 'mongoose';

const labelSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    color: { type: String, required: true, trim: true },
  },
  { _id: true },
);

const boardSchema = new Schema(
  {
    workspaceId: {
      type: Schema.Types.ObjectId,
      ref: 'Workspace',
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 1,
      maxlength: 80,
    },
    labels: {
      type: [labelSchema],
      default: [],
    },
  },
  { timestamps: true },
);

export type BoardDoc = InferSchemaType<typeof boardSchema>;
export const Board = model('Board', boardSchema);
