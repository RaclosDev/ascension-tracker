import { collectExerciseVariants } from '../../utils/exerciseHistoryVariants';
import { useMemo, useState } from 'react';
import { Search, X, Plus } from 'lucide-react';
import { ExercisePickerList } from './ExercisePickerList';
import { EXERCISE_CATALOG, BASE_EXERCISES } from '@/lib/workout/exercises';
import { useWorkoutStore } from '@/lib/workout/store';
import { normalizeString } from '@/lib/workout/format';
import { MUSCLE_LABEL, type Equipment, type MuscleGroup } from '@/lib/workout/types';
import { EQUIPMENT_OPTIONS, MUSCLE_OPTIONS } from './exercises-view';
import { useExerciseCatalog } from '@/lib/workout/catalog-query';
import {
  useRecentWorkouts,
  useCustomExercises,
  useSaveCustomExercise,
  useWorkoutPreferencesActions,
} from '@/lib/workout/api';

export function ExercisePicker() {
  const { data: catalogExercises } = useExerciseCatalog();
  const open = useWorkoutStore((s) => s.pickerOpen);
  const setPickerOpen = useWorkoutStore((s) => s.setPickerOpen);
  const addExercises = useWorkoutStore((s) => s.addExercises);
  const { prefs, addGripOption, addMachineOption } = useWorkoutPreferencesActions();
  const globalMachines = prefs?.globalMachines || [];
  const globalGrips = prefs?.globalGrips || [];
  const exerciseVariants = useMemo(() => prefs?.exerciseVariants || {}, [prefs?.exerciseVariants]);

  const { data: customExercisesData } = useCustomExercises();
  const customExercises = useMemo(() => customExercisesData || [], [customExercisesData]);
  const saveExerciseMutation = useSaveCustomExercise();
  const aliases = useMemo(() => prefs?.exerciseAliases || {}, [prefs?.exerciseAliases]);
  const customGifs = prefs?.exerciseGifs || {};
  const hiddenEquipments = useMemo(() => prefs?.hiddenEquipments || [], [prefs?.hiddenEquipments]);
  const { data: recentWorkouts = [] } = useRecentWorkouts(180);
  const history = recentWorkouts;
  const active = useWorkoutStore((s) => s.active);

  const [tab, setTab] = useState<'base' | 'all' | 'custom'>('base');
  const [query, setQuery] = useState('');
  const [filterMuscle, setFilterMuscle] = useState<MuscleGroup | 'ALL'>('ALL');
  const [filterEquip, setFilterEquip] = useState<Equipment | 'ALL'>('ALL');

  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [newMuscle, setNewMuscle] = useState<MuscleGroup>('pecho');
  const [newEquip, setNewEquip] = useState<Equipment>('barra');

  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [selectedGrip, setSelectedGrip] = useState<string | undefined>();
  const [selectedMachine, setSelectedMachine] = useState<string | undefined>();

  const { grips: historicalGrips, machines } = useMemo(
    () => collectExerciseVariants(history, expandedId),
    [history, expandedId],
  );
  const historicalMachines = useMemo(
    () => (machines.length ? machines : ['Hammer Strength', 'Technogym', 'Technogym Discos']),
    [machines],
  );

  const customGripsArray = useMemo(() => {
    return expandedId ? exerciseVariants[expandedId]?.grips || [] : [];
  }, [expandedId, exerciseVariants]);

  const customMachinesArray = useMemo(() => {
    return expandedId ? exerciseVariants[expandedId]?.machines || [] : [];
  }, [expandedId, exerciseVariants]);

  const finalHistoricalGrips = useMemo(() => {
    return Array.from(new Set([...historicalGrips, ...customGripsArray]));
  }, [historicalGrips, customGripsArray]);

  const finalHistoricalMachines = useMemo(() => {
    return Array.from(new Set([...historicalMachines, ...customMachinesArray]));
  }, [historicalMachines, customMachinesArray]);

  const handleAddGrip = (val: string) => {
    if (!expandedId) return;
    addGripOption(expandedId, val);
  };
  const handleAddMachine = (val: string) => {
    if (!expandedId) return;
    addMachineOption(expandedId, val);
  };

  const getVariantKey = (
    exerciseId: string,
    variant?: { grip?: string | null; machine?: string | null },
  ) => {
    const g = (variant?.grip || '').trim().toLowerCase();
    const m = (variant?.machine || '').trim().toLowerCase();
    return `${exerciseId}::${g}::${m}`;
  };

  const alreadyStrs = useMemo(
    () => new Set(active?.exercises.map((e) => getVariantKey(e.exerciseId, e.variant)) ?? []),
    [active],
  );

  const recentExercises = useMemo(() => {
    const all = [...customExercises, ...(catalogExercises ?? EXERCISE_CATALOG), ...BASE_EXERCISES];
    const exMap = new Map(all.map((ex) => [ex.id, ex]));

    const l = new Map<
      string,
      {
        exId: string;
        variant?: { grip?: string; machine?: string };
        timestamp: number;
        nameStr: string;
        strKey: string;
      }
    >();

    for (const w of history) {
      for (const ex of w.exercises) {
        const baseEx = exMap.get(ex.exerciseId);
        if (!baseEx) continue;
        if (hiddenEquipments.includes(baseEx.equipment)) continue;

        const strKey = getVariantKey(ex.exerciseId, ex.variant);
        if (alreadyStrs.has(strKey)) continue;

        const current = l.get(strKey)?.timestamp || 0;
        if (w.startedAt > current) {
          let nameStr = aliases[ex.exerciseId] || baseEx.name;
          if (ex.variant?.grip || ex.variant?.machine) {
            const vars = [ex.variant.machine, ex.variant.grip].filter(Boolean);
            nameStr += ` (${vars.join(' - ')})`;
          }
          l.set(strKey, {
            exId: ex.exerciseId,
            variant: ex.variant,
            timestamp: w.startedAt,
            nameStr,
            strKey,
          });
        }
      }
    }
    return Array.from(l.values())
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, 8);
  }, [history, alreadyStrs, customExercises, aliases, hiddenEquipments, catalogExercises]);

  const groupedList = useMemo(() => {
    const all =
      tab === 'base'
        ? BASE_EXERCISES
        : tab === 'custom'
          ? customExercises
          : (catalogExercises ?? EXERCISE_CATALOG);
    const q = normalizeString(query.trim());
    const filtered = all
      .filter(
        (ex: import('@/lib/workout/types').Exercise) => !hiddenEquipments.includes(ex.equipment),
      )
      .filter(
        (ex: import('@/lib/workout/types').Exercise) =>
          filterMuscle === 'ALL' || ex.muscle === filterMuscle,
      )
      .filter(
        (ex: import('@/lib/workout/types').Exercise) =>
          filterEquip === 'ALL' || ex.equipment === filterEquip,
      )
      .filter((ex: import('@/lib/workout/types').Exercise) => {
        if (!q) return true;
        const queryWords = q.split(/\s+/);
        const targetName = normalizeString(aliases[ex.id] || ex.name);
        const muscleName = normalizeString(MUSCLE_LABEL[ex.muscle as keyof typeof MUSCLE_LABEL]);
        const equipName = normalizeString(ex.equipment);
        const tagsName = normalizeString((ex.tags || []).join(' '));
        const originalName = normalizeString(ex.name);

        return queryWords.every(
          (w: string) =>
            targetName.includes(w) ||
            originalName.includes(w) ||
            muscleName.includes(w) ||
            equipName.includes(w) ||
            tagsName.includes(w),
        );
      });

    const groups = new Map<string, typeof all>();
    for (const ex of filtered) {
      const dName = aliases[ex.id] || ex.name;
      const baseName = dName
        .replace(/\s*\(.*$/, '')
        .trim()
        .toLowerCase();
      if (!groups.has(baseName)) groups.set(baseName, []);
      groups.get(baseName)!.push(ex);
    }

    return Array.from(groups.values()).sort(
      (
        a: import('@/lib/workout/types').Exercise[],
        b: import('@/lib/workout/types').Exercise[],
      ) => {
        const nameA = aliases[a[0].id] || a[0].name;
        const nameB = aliases[b[0].id] || b[0].name;
        return nameA.localeCompare(nameB);
      },
    );
  }, [
    tab,
    customExercises,
    filterMuscle,
    filterEquip,
    query,
    aliases,
    hiddenEquipments,
    catalogExercises,
  ]);

  function close() {
    setPickerOpen(false);
    setQuery('');
    setFilterMuscle('ALL');
    setFilterEquip('ALL');
    setCreating(false);
    setExpandedId(null);
  }

  function toggleExpand(exId: string) {
    if (expandedId === exId) {
      setExpandedId(null);
    } else {
      setExpandedId(exId);
      setSelectedGrip(undefined);
      setSelectedMachine(undefined);
    }
  }

  function handleAddVariant(exId: string) {
    const variant: { grip?: string; machine?: string } = {};
    if (selectedGrip) variant.grip = selectedGrip;
    if (selectedMachine) variant.machine = selectedMachine;

    addExercises(
      [{ exerciseId: exId, variant: Object.keys(variant).length > 0 ? variant : undefined }],
      history,
    );
    setExpandedId(null);
  }

  if (!open) return null;

  return (
    <>
      <div className="workout-sheet-overlay" aria-hidden="true" onClick={close} />
      <div className="workout-sheet" style={{ maxHeight: '95dvh' }}>
        <div className="workout-sheet-handle" />
        <div className="workout-sheet-header">
          <span className="workout-sheet-title">Añadir ejercicios</span>
          <button className="workout-sheet-close" onClick={close}>
            <X size={22} />
          </button>
        </div>

        {/* Tabs */}
        <div
          style={{
            display: 'flex',
            gap: '0.5rem',
            padding: '0 1.25rem 0.5rem',
            borderBottom: '1px solid var(--border-medium)',
            marginBottom: '0.5rem',
          }}
        >
          {(['base', 'all', 'custom'] as const).map((t) => (
            <button
              key={t}
              onClick={() => {
                setTab(t);
                setExpandedId(null);
              }}
              style={{
                flex: 1,
                padding: '0.5rem',
                borderRadius: '8px',
                fontSize: '0.85rem',
                fontWeight: tab === t ? '600' : '400',
                background: tab === t ? 'var(--text-primary)' : 'transparent',
                color: tab === t ? 'var(--bg-primary)' : 'var(--text-secondary)',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              {t === 'base' ? 'Básicos' : t === 'all' ? 'Todos' : 'Personalizados'}
            </button>
          ))}
        </div>

        <div style={{ padding: '0 1.25rem' }}>
          <div className="picker-search-wrapper">
            <Search size={16} className="picker-search-icon" />
            <input
              type="search"
              enterKeyHint="search"
              autoCapitalize="none"
              autoCorrect="off"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar press, sentadilla"
              className="picker-search-input"
            />
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '0.5rem',
              marginTop: '0.5rem',
            }}
          >
            <select
              value={filterMuscle}
              onChange={(e) =>
                setFilterMuscle(e.target.value as import('@/lib/workout/types').MuscleGroup | 'ALL')
              }
              className="form-input"
              style={{
                padding: '0.5rem',
                fontSize: '0.85rem',
                background: 'var(--bg-secondary)',
                borderRadius: '8px',
                border: '1px solid var(--border-medium)',
                color: 'var(--text-primary)',
              }}
            >
              <option value="ALL">Músculo: Todos</option>
              {MUSCLE_OPTIONS.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.label}
                </option>
              ))}
            </select>
            <select
              value={filterEquip}
              onChange={(e) =>
                setFilterEquip(e.target.value as import('@/lib/workout/types').Equipment | 'ALL')
              }
              className="form-input"
              style={{
                padding: '0.5rem',
                fontSize: '0.85rem',
                background: 'var(--bg-secondary)',
                borderRadius: '8px',
                border: '1px solid var(--border-medium)',
                color: 'var(--text-primary)',
              }}
            >
              <option value="ALL">Material: Todos</option>
              {EQUIPMENT_OPTIONS.filter((eq) => !hiddenEquipments.includes(eq.id)).map((eq) => (
                <option key={eq.id} value={eq.id}>
                  {eq.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Scrollable body */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '0 0.75rem',
            WebkitOverflowScrolling: 'touch',
          }}
        >
          {recentExercises.length > 0 &&
            !query &&
            filterMuscle === 'ALL' &&
            filterEquip === 'ALL' && (
              <div className="picker-recents-section">
                <div className="picker-recents-label"> Recientes</div>
                <div className="picker-recents-grid">
                  {recentExercises.map((r) => (
                    <button
                      key={r.strKey}
                      className="picker-recent-chip"
                      onClick={() =>
                        addExercises([{ exerciseId: r.exId, variant: r.variant }], history)
                      }
                    >
                      {r.nameStr}
                    </button>
                  ))}
                </div>
              </div>
            )}

          {/* Exercise List */}
          <ExercisePickerList
            groupedList={groupedList}
            aliases={aliases}
            customGifs={customGifs}
            active={active}
            expandedId={expandedId}
            toggleExpand={toggleExpand}
            selectedGrip={selectedGrip}
            setSelectedGrip={setSelectedGrip}
            selectedMachine={selectedMachine}
            setSelectedMachine={setSelectedMachine}
            finalHistoricalGrips={finalHistoricalGrips}
            finalHistoricalMachines={finalHistoricalMachines}
            globalGrips={globalGrips}
            globalMachines={globalMachines}
            handleAddGrip={handleAddGrip}
            handleAddMachine={handleAddMachine}
            handleAddVariant={handleAddVariant}
          />
        </div>

        <div className="picker-create-section">
          {creating ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <input
                type="text"
                enterKeyHint="done"
                autoCapitalize="sentences"
                className="picker-search-input"
                style={{ paddingLeft: '0.75rem' }}
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Nombre del ejercicio"
                autoFocus
              />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                <select
                  value={newMuscle}
                  onChange={(e) => setNewMuscle(e.target.value as MuscleGroup)}
                  className="form-input"
                  style={{ padding: '0.5rem', fontSize: '0.85rem' }}
                >
                  {MUSCLE_OPTIONS.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.label}
                    </option>
                  ))}
                </select>
                <select
                  value={newEquip}
                  onChange={(e) => setNewEquip(e.target.value as Equipment)}
                  className="form-input"
                  style={{ padding: '0.5rem', fontSize: '0.85rem' }}
                >
                  {EQUIPMENT_OPTIONS.map((eq) => (
                    <option key={eq.id} value={eq.id}>
                      {eq.label}
                    </option>
                  ))}
                </select>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  onClick={() => setCreating(false)}
                  className="workout-secondary-btn"
                  style={{ flex: 1 }}
                >
                  Cancelar
                </button>
                <button
                  className="btn btn-primary"
                  style={{ flex: 1, borderRadius: '12px' }}
                  disabled={!newName.trim()}
                  onClick={() => {
                    saveExerciseMutation.mutate({
                      id: crypto.randomUUID(),
                      custom: true,
                      name: newName.trim(),
                      muscle: newMuscle,
                      equipment: newEquip,
                    });
                    setNewName('');
                    setCreating(false);
                    setTab('custom');
                  }}
                >
                  Crear
                </button>
              </div>
            </div>
          ) : (
            <button type="button" onClick={() => setCreating(true)} className="picker-create-btn">
              <Plus size={16} />
              Crear ejercicio
            </button>
          )}
        </div>
      </div>
    </>
  );
}
