import { Schema, model, type InferSchemaType } from 'mongoose';

const columnSchema = new Schema(
  {
    boardId: {
      type: Schema.Types.ObjectId,
      ref: 'Board',
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 1,
      maxlength: 60,
    },
    position: {
      type: Number,
      required: true,
    },
  },
  { timestamps: true },
);

columnSchema.index({ boardId: 1, position: 1 });

export type ColumnDoc = InferSchemaType<typeof columnSchema>;
export const Column = model('Column', columnSchema);
