import { Schema, model, type InferSchemaType } from 'mongoose';

const taskSchema = new Schema(
  {
    boardId: {
      type: Schema.Types.ObjectId,
      ref: 'Board',
      required: true,
      index: true,
    },
    columnId: {
      type: Schema.Types.ObjectId,
      ref: 'Column',
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      minlength: 1,
      maxlength: 200,
    },
    description: {
      type: String,
      required: false,
      maxlength: 10000,
      default: '',
    },
    assigneeId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: false,
      default: null,
      index: true,
    },
    labelIds: {
      type: [Schema.Types.ObjectId],
      default: [],
    },
    dueDate: {
      type: Date,
      required: false,
      default: null,
    },
    position: {
      type: Number,
      required: true,
    },
    version: {
      type: Number,
      required: true,
      default: 0,
    },
  },
  { timestamps: true },
);

taskSchema.index({ columnId: 1, position: 1 });

export type TaskDoc = InferSchemaType<typeof taskSchema>;
export const Task = model('Task', taskSchema);
