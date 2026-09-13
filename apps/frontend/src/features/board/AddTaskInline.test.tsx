import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AddTaskInline } from './AddTaskInline';

describe('AddTaskInline', () => {
  it('starts collapsed as a single "Add task" affordance', () => {
    render(<AddTaskInline onCreate={vi.fn()} />);
    expect(screen.getByRole('button', { name: /add task/i })).toBeInTheDocument();
    expect(screen.queryByLabelText(/new task title/i)).not.toBeInTheDocument();
  });

  it('creates a task with the trimmed title on submit and clears the field', async () => {
    const onCreate = vi.fn().mockResolvedValue(undefined);
    render(<AddTaskInline onCreate={onCreate} />);
    const user = userEvent.setup();

    await user.click(screen.getByRole('button', { name: /add task/i }));
    const input = screen.getByLabelText(/new task title/i);
    await user.type(input, '  Write the report  {enter}');

    expect(onCreate).toHaveBeenCalledWith('Write the report');
  });

  it('does not submit an empty/whitespace-only title', async () => {
    const onCreate = vi.fn();
    render(<AddTaskInline onCreate={onCreate} />);
    const user = userEvent.setup();

    await user.click(screen.getByRole('button', { name: /add task/i }));
    await user.type(screen.getByLabelText(/new task title/i), '   {enter}');

    expect(onCreate).not.toHaveBeenCalled();
  });
});
