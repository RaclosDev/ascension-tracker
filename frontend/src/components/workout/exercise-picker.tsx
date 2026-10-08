import { useMemo, useState } from 'react';
import { Search, Dumbbell, X, Plus, ChevronDown, ChevronUp } from 'lucide-react';
import { VariantSelector } from './variant-selector';
import { EXERCISE_CATALOG, BASE_EXERCISES } from '@/lib/workout/exercises';
import { useWorkoutStore } from '@/lib/workout/store';
import { normalizeString } from '@/lib/workout/format';
import { MUSCLE_LABEL, type Equipment, type MuscleGroup } from '@/lib/workout/types';
import { EQUIPMENT_OPTIONS, MUSCLE_OPTIONS } from './exercises-view';
import { useRecentWorkouts, useCustomExercises, useSaveCustomExercise } from '@/lib/workout/api';

export function ExercisePicker() {
  const open = useWorkoutStore((s) => s.pickerOpen);
  const setPickerOpen = useWorkoutStore((s) => s.setPickerOpen);
  const addExercises = useWorkoutStore((s) => s.addExercises);
  const globalMachines = useWorkoutStore((s) => s.globalMachines);
  const globalGrips = useWorkoutStore((s) => s.globalGrips);
  const exerciseVariants = useWorkoutStore((s) => s.exerciseVariants);
  const addGlobalMachine = useWorkoutStore((s) => s.addGlobalMachine);
  const addGlobalGrip = useWorkoutStore((s) => s.addGlobalGrip);
  const addExerciseVariant = useWorkoutStore((s) => s.addExerciseVariant);

  const { data: customExercisesData } = useCustomExercises();
  const customExercises = customExercisesData || [];
  const saveExerciseMutation = useSaveCustomExercise();
  const addCustomExercise = (ex: Partial<import('@/lib/workout/types').Exercise>) => {
    const id = ex.id || Date.now().toString();
    saveExerciseMutation.mutate({ ...ex, id } as import('@/lib/workout/types').Exercise);
    return id;
  };
  const aliases = useWorkoutStore((s) => s.exerciseAliases);
  const customGifs = useWorkoutStore((s) => s.exerciseGifs);
  const hiddenEquipments = useWorkoutStore((s) => s.hiddenEquipments) || [];
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

  const historicalMachines = useMemo(() => {
    if (!expandedId) return ['Hammer Strength', 'Technogym', 'Technogym Discos'];
    const machines = new Set<string>();
    for (const w of history) {
      for (const ex of w.exercises) {
        if (ex.exerciseId === expandedId && ex.variant?.machine) {
          machines.add(ex.variant.machine);
        }
      }
    }
    const arr = Array.from(machines);
    if (arr.length === 0) return ['Hammer Strength', 'Technogym', 'Technogym Discos'];
    return arr;
  }, [expandedId, history]);
  const historicalGrips = useMemo(() => {
    if (!expandedId) return [];
    const grips = new Set<string>();
    for (const w of history) {
      for (const ex of w.exercises) {
        if (ex.exerciseId === expandedId && ex.variant?.grip) {
          grips.add(ex.variant.grip);
        }
      }
    }
    return Array.from(grips).sort();
  }, [expandedId, history]);

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
    addGlobalGrip(val);
    addExerciseVariant(expandedId, 'grip', val);
  };
  const handleAddMachine = (val: string) => {
    if (!expandedId) return;
    addGlobalMachine(val);
    addExerciseVariant(expandedId, 'machine', val);
  };

  const alreadyStrs = useMemo(
    () =>
      new Set(
        active?.exercises.map((e) => JSON.stringify({ id: e.exerciseId, variant: e.variant })) ??
          [],
      ),
    [active],
  );

  const recentExercises = useMemo(() => {
    const all = [...customExercises, ...EXERCISE_CATALOG, ...BASE_EXERCISES];
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

        const strKey = JSON.stringify({ id: ex.exerciseId, variant: ex.variant });
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
      .sort((a: any, b: any) => b.timestamp - a.timestamp)
      .slice(0, 8);
  }, [history, alreadyStrs, customExercises, aliases, hiddenEquipments]);

  const groupedList = useMemo(() => {
    const all =
      tab === 'base' ? BASE_EXERCISES : tab === 'custom' ? customExercises : EXERCISE_CATALOG;
    const q = normalizeString(query.trim());
    const filtered = all
      .filter((ex: any) => !hiddenEquipments.includes(ex.equipment))
      .filter((ex: any) => filterMuscle === 'ALL' || ex.muscle === filterMuscle)
      .filter((ex: any) => filterEquip === 'ALL' || ex.equipment === filterEquip)
      .filter((ex: any) => {
        if (!q) return true;
        const queryWords = q.split(/\s+/);
        const targetName = normalizeString(aliases[ex.id] || ex.name);
        const muscleName = normalizeString(MUSCLE_LABEL[ex.muscle as keyof typeof MUSCLE_LABEL]);
        const equipName = normalizeString(ex.equipment);
        const tagsName = normalizeString((ex.tags || []).join(' '));
        const originalName = normalizeString(ex.name);

        return queryWords.every(
          (w: any) =>
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

    return Array.from(groups.values()).sort((a: any, b: any) => {
      const nameA = aliases[a[0].id] || a[0].name;
      const nameB = aliases[b[0].id] || b[0].name;
      return nameA.localeCompare(nameB);
    });
  }, [tab, customExercises, filterMuscle, filterEquip, query, aliases, hiddenEquipments]);

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
      <div className="workout-sheet-overlay" onClick={close} />
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

        {/* Search */}
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
          {/* Recents Section */}
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
          {groupedList.length === 0 ? (
            <p
              style={{
                padding: '3rem 1rem',
                textAlign: 'center',
                fontSize: '0.88rem',
                color: 'var(--text-secondary)',
              }}
            >
              Nada coincide.
            </p>
          ) : (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '0.15rem',
                paddingBottom: '0.5rem',
              }}
            >
              {groupedList.map((group) => {
                const isGroup = group.length > 1;
                const baseName = isGroup
                  ? (aliases[group[0].id] || group[0].name).replace(/\s*\(.*$/, '').trim()
                  : null;

                return (
                  <div key={group[0].id + '_group'}>
                    {isGroup && <div className="picker-group-header">{baseName}</div>}
                    <div style={{ paddingLeft: isGroup ? '0.25rem' : '0' }}>
                      {group.map((ex: any) => {
                        const dName = aliases[ex.id] || ex.name;
                        const shortName = isGroup
                          ? dName.replace(/^[^(]*\(\s*/, '').replace(/\)\s*$/, '')
                          : dName;

                        const isExpanded = expandedId === ex.id;

                        return (
                          <div key={ex.id} style={{ display: 'flex', flexDirection: 'column' }}>
                            <button
                              type="button"
                              onClick={() => toggleExpand(ex.id)}
                              className="picker-exercise-item"
                              style={{
                                borderBottomLeftRadius: isExpanded ? 0 : undefined,
                                borderBottomRightRadius: isExpanded ? 0 : undefined,
                                borderBottom: isExpanded
                                  ? '1px solid var(--border-medium)'
                                  : undefined,
                              }}
                            >
                              {customGifs[ex.id] !== 'none' && (customGifs[ex.id] || ex.gifUrl) ? (
                                <img
                                  src={customGifs[ex.id] || ex.gifUrl}
                                  alt=""
                                  loading="lazy"
                                  className="picker-exercise-thumb"
                                />
                              ) : (
                                <div className="picker-exercise-thumb-placeholder">
                                  <Dumbbell size={18} />
                                </div>
                              )}

                              <div className="picker-exercise-info">
                                <div className="picker-exercise-name">
                                  {shortName}
                                  {ex.custom && <span className="picker-custom-badge">Custom</span>}
                                </div>
                                <div className="picker-exercise-meta">
                                  {MUSCLE_LABEL[ex.muscle as keyof typeof MUSCLE_LABEL]} · {ex.equipment}
                                </div>
                              </div>
                              <div
                                style={{
                                  color: 'var(--text-secondary)',
                                  marginLeft: 'auto',
                                  paddingRight: '0.5rem',
                                }}
                              >
                                {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                              </div>
                            </button>

                            {/* Accordion Expansion */}
                            {isExpanded && (
                              <div
                                style={{
                                  padding: '1rem',
                                  background: 'var(--bg-secondary)',
                                  borderBottomLeftRadius: '12px',
                                  borderBottomRightRadius: '12px',
                                  marginBottom: '0.15rem',
                                }}
                              >
                                {/* Grips */}
                                <div style={{ marginBottom: '1rem' }}>
                                  <div
                                    style={{
                                      fontSize: '0.85rem',
                                      color: 'var(--text-secondary)',
                                      marginBottom: '0.5rem',
                                      fontWeight: 600,
                                    }}
                                  >
                                    Agarre
                                  </div>
                                  <VariantSelector
                                    type="grip"
                                    value={selectedGrip}
                                    onChange={(val) => setSelectedGrip(val)}
                                    historicalOptions={finalHistoricalGrips}
                                    globalOptions={globalGrips}
                                    onAddOption={handleAddGrip}
                                  />
                                </div>

                                {/* Machine (Input + Chips) */}
                                {(ex.equipment === 'maquina' ||
                                  ex.equipment === 'polea' ||
                                  ex.equipment === 'multipower') && (
                                  <div style={{ marginBottom: '1rem' }}>
                                    <div
                                      style={{
                                        fontSize: '0.85rem',
                                        color: 'var(--text-secondary)',
                                        marginBottom: '0.5rem',
                                        fontWeight: 600,
                                      }}
                                    >
                                      Máquina / Variante
                                    </div>
                                    <VariantSelector
                                      type="machine"
                                      value={selectedMachine}
                                      onChange={(val) => setSelectedMachine(val)}
                                      historicalOptions={finalHistoricalMachines}
                                      globalOptions={globalMachines}
                                      onAddOption={handleAddMachine}
                                    />
                                  </div>
                                )}

                                <button
                                  className="btn btn-primary"
                                  style={{
                                    width: '100%',
                                    borderRadius: '8px',
                                    padding: '0.75rem',
                                    marginTop: '0.5rem',
                                  }}
                                  onClick={() => handleAddVariant(ex.id)}
                                >
                                  Añadir al entreno
                                </button>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Create Exercise */}
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
                    addCustomExercise({
                      name: newName,
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




