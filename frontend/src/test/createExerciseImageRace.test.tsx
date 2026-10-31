import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { CreateExerciseModal } from '../components/workout/exercises/CreateExerciseModal';
class Reader {
  static instances: Reader[] = [];
  readyState = 1;
  abort = vi.fn();
  readAsDataURL = vi.fn();
  onload: ((event: { target: { result: string } }) => void) | null = null;
  constructor() {
    Reader.instances.push(this);
  }
  finish() {
    this.onload?.({ target: { result: 'data:image/png;base64,old' } });
  }
}
class DeferredImage {
  static instances: DeferredImage[] = [];
  src = '';
  width = 10;
  height = 10;
  onload: (() => void) | null = null;
  constructor() {
    DeferredImage.instances.push(this);
  }
}
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  Reader.instances = [];
  DeferredImage.instances = [];
});
it('ignores image decodes after replacement and close, and aborts stale readers', () => {
  vi.stubGlobal('FileReader', Reader);
  vi.stubGlobal('Image', DeferredImage);
  const canvas = vi.spyOn(HTMLCanvasElement.prototype, 'getContext');
  const props = { isOpen: true, onClose: vi.fn(), onSubmit: vi.fn() };
  const view = render(<CreateExerciseModal {...props} />);
  const select = () =>
    fireEvent.change(screen.getByLabelText('Subir foto del ejercicio o máquina'), {
      target: { files: [new File(['image'], 'photo.png', { type: 'image/png' })] },
    });
  select();
  act(() => Reader.instances[0].finish());
  select();
  expect(Reader.instances[0].abort).toHaveBeenCalled();
  act(() => DeferredImage.instances[0].onload?.());
  expect(canvas).not.toHaveBeenCalled();
  act(() => Reader.instances[1].finish());
  view.rerender(<CreateExerciseModal {...props} isOpen={false} />);
  act(() => DeferredImage.instances[1].onload?.());
  expect(canvas).not.toHaveBeenCalled();
});
