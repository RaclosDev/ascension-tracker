import { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Button } from '../../src/components/ui/button';
import {
  Dialog,
  DialogTrigger,
  DialogContentFullScreen,
  DialogTitle,
} from '../../src/components/ui/dialog';
import { SegmentedControl } from '../../src/components/ui/segmented-control';
import { ExerciseFilterBar } from '../../src/components/workout/exercises/ExerciseFilterBar';
import { SetAdjustmentBar } from '../../src/components/workout/SetAdjustmentBar';
import { VariantSelector } from '../../src/components/workout/variant-selector';
import type { ExerciseTabFilter } from '../../src/hooks/workout/useExerciseFilters';
import { applyThemeColor } from '../../src/utils/colorHelper';
import '../../src/index.css';
import '../../src/paper.css';

const noop = () => {};
const params = new URLSearchParams(location.search);
document.documentElement.dataset.mode = params.get('mode') ?? 'dark';
applyThemeColor('#0b5f74');

function Controls() {
  const [filter, setFilter] = useState<ExerciseTabFilter>('basicos');
  const [variant, setVariant] = useState<string | undefined>('Prono');
  const [segment, setSegment] = useState('one');
  return (
    <>
      <ExerciseFilterBar
        query=""
        setQuery={noop}
        filter={filter}
        setFilter={setFilter}
        filterMuscle="ALL"
        setFilterMuscle={noop}
        filterEquip="ALL"
        setFilterEquip={noop}
      />
      <SegmentedControl
        options={[
          { label: 'Uno', value: 'one' },
          { label: 'Dos', value: 'two' },
        ]}
        value={segment}
        onChange={setSegment}
      />
      <VariantSelector
        type="grip"
        value={variant}
        onChange={setVariant}
        historicalOptions={['Prono', 'Supino']}
        globalOptions={[]}
        onAddOption={noop}
      />
      <SetAdjustmentBar
        label="Peso"
        negative={[-5]}
        positive={[5]}
        onAdjust={noop}
        onInteract={noop}
      />
      <Button>Guardar</Button>
      <Button variant="success">Completado</Button>
      <button className="btn btn-primary">Continuar</button>
      <button className="btn btn-danger">Eliminar</button>
      <button className="set-check-btn checked" aria-label="Serie completada">
        ✓
      </button>
      <button className="set-check-btn" aria-label="Marcar serie">
        ✓
      </button>
    </>
  );
}

function Fixture() {
  return (
    <main style={{ padding: 24 }}>
      <label>
        Color{' '}
        <input
          aria-label="Color de acento"
          type="color"
          defaultValue="#0b5f74"
          onChange={(event) => applyThemeColor(event.target.value)}
        />
      </label>
      {['wall', 'card', 'dialog'].map((scope) => (
        <section
          key={scope}
          data-testid={scope}
          className={scope === 'card' ? 'card' : undefined}
          role={scope === 'dialog' ? 'dialog' : undefined}
          aria-label={scope}
          style={{ padding: 16, margin: '16px 0', background: 'var(--bg-card)' }}
        >
          <Controls />
        </section>
      ))}
      <Dialog>
        <DialogTrigger asChild>
          <Button>Abrir diálogo</Button>
        </DialogTrigger>
        <DialogContentFullScreen aria-describedby={undefined}>
          <DialogTitle>Vista de prueba</DialogTitle>
        </DialogContentFullScreen>
      </Dialog>
    </main>
  );
}

createRoot(document.getElementById('root')!).render(<Fixture />);
