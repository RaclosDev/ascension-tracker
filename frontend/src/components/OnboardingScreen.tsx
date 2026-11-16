import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/client';
import toast from 'react-hot-toast';
import { User, Scale, Activity, Users } from 'lucide-react';
import {
  APP_MODULE_OPTIONS,
  hasNutrition,
  normalizeModules,
  type AppModules,
} from '../lib/appModules';
import {
  peekPendingInvitation,
  personName,
  useInvitationPreview,
  type InvitationProfile,
} from '../lib/coach/api';
import { calcBmr, calcTdee, parseNumber } from '../utils/nutritionCalculators';
import { getLocalDateString } from '../utils/dateHelper';
import WeightLossPlan, { weightGoal } from './calculators/WeightLossPlan';
import MacroConfigurator from './calculators/MacroConfigurator';

import { MacroForm } from './calculators/MacroConfigurator';

interface OnboardingForm extends MacroForm {
  sex: 'M' | 'F';
  age: string;
  heightCm: string;
  activityFactor: string;
}

export default function OnboardingScreen({
  onComplete,
}: {
  /** Called once saved; with a path when the app should open there instead of reloading. */
  onComplete: (path?: string) => void;
}) {
  const { logout } = useAuth();
  const [step, setStep] = useState(0);
  // Quien llega con un enlace de invitación es atleta: no le preguntamos si es entrenador.
  // También si ya tenía sesión y abrió el enlace directamente (no se guarda el token pendiente).
  const [invited] = useState(
    () => peekPendingInvitation() !== null || window.location.pathname.startsWith('/invitacion/'),
  );
  const [invitationToken] = useState(
    () =>
      peekPendingInvitation() ??
      decodeURIComponent(window.location.pathname.match(/^\/invitacion\/([^/]+)/)?.[1] ?? ''),
  );
  // Si el entrenador ya rellenó sus datos al invitarle, el atleta solo tiene que confirmar.
  const invitation = useInvitationPreview(invitationToken, invited);
  const prefill = invitation.data?.profile ?? null;
  const [appliedPrefill, setAppliedPrefill] = useState<InvitationProfile | null>(null);
  const [reviewing, setReviewing] = useState(false);
  const [role, setRole] = useState<'user' | 'coach'>('user');
  const [modules, setModules] = useState<AppModules>('FULL');
  // El entrenador no rellena «Sobre ti» ni el plan: entra directo a gestionar atletas.
  const isCoach = !invited && role === 'coach';
  const withNutrition = !isCoach && hasNutrition(modules);
  const [form, setForm] = useState<OnboardingForm>({
    sex: 'M',
    age: '',
    heightCm: '',
    startWeight: '',
    goalWeight: '',
    activityFactor: '1.2',
    kcal: 2000,
    macroStrategy: 'BALANCED',
    customProteinGrams: '',
    customFatGrams: '',
    customCarbsGrams: '',
    customProteinPct: '',
    customFatPct: '',
    customCarbsPct: '',
  });

  if (prefill && prefill !== appliedPrefill) {
    setAppliedPrefill(prefill);
    setForm((f) => ({
      ...f,
      sex: prefill.sex ?? f.sex,
      age: prefill.age != null ? String(prefill.age) : f.age,
      heightCm: prefill.heightCm != null ? String(prefill.heightCm) : f.heightCm,
      startWeight: prefill.startWeight != null ? String(prefill.startWeight) : f.startWeight,
      goalWeight: prefill.goalWeight != null ? String(prefill.goalWeight) : f.goalWeight,
      activityFactor:
        prefill.activityFactor != null ? String(prefill.activityFactor) : f.activityFactor,
    }));
    if (prefill.appModules) setModules(normalizeModules(prefill.appModules));
  }
  const quickStart = invited && prefill !== null && !reviewing && step === 0;

  const [mealOption, setMealOption] = useState<'default' | 'custom'>('default');
  const [customMealsCount, setCustomMealsCount] = useState<number>(3);

  const [loading, setLoading] = useState(false);

  const handleNextStep = (e: React.FormEvent) => {
    e.preventDefault();
    setStep(step + 1);
  };

  const handlePreviousStep = () => {
    setStep(step - 1);
  };

  const handleSavePlan = (kcal: number) => {
    setForm({ ...form, kcal });
    setStep(4);
  };

  // Sin nutrición no pasamos por el plan: guardamos el mantenimiento estimado como referencia.
  const maintenanceKcal = () => {
    const weight = parseNumber(form.startWeight);
    const height = parseNumber(form.heightCm);
    const age = parseNumber(form.age);
    const bmr = weight && height && age ? calcBmr(form.sex, weight, height, age) : null;
    if (!bmr) return 2000;
    return Math.round(calcTdee(bmr, parseNumber(form.activityFactor) || 1.2));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await save(false);
  };

  // Atajo del atleta invitado con datos ya rellenados: calorías de mantenimiento y comidas por
  // defecto; su entrenador le fija los objetivos después.
  const handleQuickStart = async (e: React.FormEvent) => {
    e.preventDefault();
    await save(true);
  };

  const save = async (quick: boolean) => {
    setLoading(true);

    try {
      // El backend exige un plan básico; para el entrenador guardamos uno neutro y solo entreno
      // (sin seguimiento corporal, así no se registra ningún peso). Lo puede completar en Ajustes.
      const payload = isCoach
        ? {
            startWeight: 70,
            goalWeight: 70,
            weeklyGoal: 0,
            kcal: 2000,
            startDate: getLocalDateString(),
            appModules: 'TRAINING' satisfies AppModules,
          }
        : {
            sex: form.sex,
            age: parseInt(form.age) || null,
            heightCm: parseInt(form.heightCm) || null,
            startWeight: parseFloat(String(form.startWeight)) || null,
            goalWeight: parseFloat(String(form.goalWeight)) || null,
            activityFactor: parseFloat(form.activityFactor),
            kcal: withNutrition && !quick ? Number(form.kcal) : maintenanceKcal(),
            macroStrategy: form.macroStrategy,
            weeklyGoal: 0.5,
            startDate: getLocalDateString(),
            appModules: modules,
          };
      await api.put('/settings', payload);

      if (quick || mealOption === 'default') {
        await api.post('/nutrition/meals/reset');
      } else {
        for (let i = 1; i <= customMealsCount; i++) {
          await api.post('/nutrition/meals', { name: `Comida ${i}`, icon: '' });
        }
      }

      if (isCoach) {
        try {
          await api.post('/coach/profile');
          toast.success('¡Listo! Ya puedes invitar a tus atletas.');
          onComplete('/entrenador');
          return;
        } catch {
          toast.error(
            'Tu cuenta está lista, pero no se pudo activar el modo entrenador. Actívalo desde Entrenador.',
          );
        }
      } else {
        toast.success('¡Configuración completada!');
      }
      onComplete(invited && invitationToken ? `/invitacion/${invitationToken}` : undefined);
    } catch (err) {
      toast.error('Error al guardar configuración inicial');
      console.error(
        'Error al guardar configuración inicial:',
        err instanceof Error ? err.message : String(err),
      );
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        // body tiene overflow:hidden: esta pantalla tiene que desplazarse por sí misma.
        height: '100dvh',
        overflowY: 'auto',
        overscrollBehaviorY: 'contain',
        display: 'flex',
        flexDirection: 'column',
        background: 'var(--bg-main)',
        color: 'var(--text-primary)',
        padding: '1.5rem',
      }}
    >
      <div
        style={{
          background: 'var(--bg-glass-strong, rgba(18, 18, 26, 0.78))',
          padding: '2rem',
          borderRadius: '24px',
          border: '1px solid var(--border-medium, rgba(255, 255, 255, 0.1))',
          boxShadow: '0 24px 64px rgba(0, 0, 0, 0.85)',
          width: '100%',
          maxWidth: '420px',
          // margin:auto centra la tarjeta sin recortar su parte superior cuando no cabe.
          margin: 'auto',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '0.75rem' }}>
          <button
            type="button"
            onClick={() => void logout()}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-secondary, #94a3b8)',
              fontSize: '0.85rem',
              cursor: 'pointer',
              padding: '0.25rem 0.5rem',
            }}
          >
            ← Volver al login
          </button>
        </div>
        {quickStart && invitation.data ? (
          <PrefilledStart
            coachName={personName(invitation.data.coach)}
            profile={prefill}
            modules={modules}
            loading={loading}
            onConfirm={handleQuickStart}
            onReview={() => setReviewing(true)}
          />
        ) : step === 0 ? (
          <form
            onSubmit={isCoach ? handleSubmit : handleNextStep}
            style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}
          >
            <div style={{ textAlign: 'center' }}>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 700, margin: '0 0 0.5rem 0' }}>
                Bienvenido a Ascension
              </h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', margin: 0 }}>
                Cuéntanos cómo la vas a usar. Puedes cambiarlo luego en Ajustes.
              </p>
            </div>

            {!invited && (
              <fieldset style={{ border: 0, padding: 0, margin: 0 }}>
                <legend className="form-label" style={{ marginBottom: '0.5rem' }}>
                  ¿Quién eres?
                </legend>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                  {(
                    [
                      { value: 'user', label: 'Entreno yo', icon: <User size={18} aria-hidden /> },
                      {
                        value: 'coach',
                        label: 'Soy entrenador',
                        icon: <Users size={18} aria-hidden />,
                      },
                    ] as const
                  ).map((o) => (
                    <label
                      key={o.value}
                      className="onboarding-option"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                      }}
                    >
                      <input
                        type="radio"
                        name="onboarding-role"
                        value={o.value}
                        checked={role === o.value}
                        onChange={() => setRole(o.value)}
                        className="sr-only"
                      />
                      {o.icon}
                      <span style={{ fontWeight: 600 }}>{o.label}</span>
                    </label>
                  ))}
                </div>
                {role === 'coach' && (
                  <p
                    style={{
                      color: 'var(--text-secondary)',
                      fontSize: '0.85rem',
                      marginTop: '0.5rem',
                    }}
                  >
                    Activaremos el modo entrenador para que invites a tus atletas. Si también
                    quieres llevar tu propio entreno o tu nutrición, actívalo luego en Ajustes.
                  </p>
                )}
              </fieldset>
            )}

            {!isCoach && (
              <fieldset style={{ border: 0, padding: 0, margin: 0 }}>
                <legend className="form-label" style={{ marginBottom: '0.5rem' }}>
                  ¿Qué quieres llevar en la app?
                </legend>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {APP_MODULE_OPTIONS.map((o) => (
                    <label key={o.value} className="onboarding-option">
                      <input
                        type="radio"
                        name="onboarding-modules"
                        value={o.value}
                        checked={modules === o.value}
                        onChange={() => setModules(o.value)}
                        className="sr-only"
                      />
                      <span style={{ fontWeight: 600, display: 'block' }}>{o.label}</span>
                      <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                        {o.description}
                      </span>
                    </label>
                  ))}
                </div>
              </fieldset>
            )}

            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
              style={{ width: '100%', padding: '0.875rem' }}
            >
              {isCoach ? (loading ? 'Guardando…' : 'Empezar') : 'Continuar'}
            </button>
          </form>
        ) : step === 1 ? (
          <>
            <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 700, margin: '0 0 0.5rem 0' }}>
                Sobre ti
              </h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', margin: 0 }}>
                Unos datos básicos para calcular tu gasto y tus marcas relativas.
              </p>
            </div>

            <form
              onSubmit={withNutrition ? handleNextStep : handleSubmit}
              style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}
            >
              <div style={{ display: 'flex', gap: '1rem' }}>
                <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
                  <label
                    htmlFor="onboarding-screen-sexo"
                    className="form-label"
                    style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
                  >
                    <User size={14} /> Sexo
                  </label>
                  <select
                    id="onboarding-screen-sexo"
                    className="form-input"
                    value={form.sex}
                    onChange={(e) => setForm({ ...form, sex: e.target.value as 'M' | 'F' })}
                  >
                    <option value="M">Hombre</option>
                    <option value="F">Mujer</option>
                  </select>
                </div>
                <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
                  <label htmlFor="onboarding-screen-edad" className="form-label">
                    Edad
                  </label>
                  <input
                    id="onboarding-screen-edad"
                    type="number"
                    required
                    className="form-input"
                    value={form.age}
                    onChange={(e) => setForm({ ...form, age: e.target.value })}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '1rem' }}>
                <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
                  <label htmlFor="onboarding-screen-altura-cm" className="form-label">
                    Altura (cm)
                  </label>
                  <input
                    id="onboarding-screen-altura-cm"
                    type="number"
                    required
                    className="form-input"
                    value={form.heightCm}
                    onChange={(e) => setForm({ ...form, heightCm: e.target.value })}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '1rem' }}>
                <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
                  <label
                    htmlFor="onboarding-screen-peso-inicial-kg"
                    className="form-label"
                    style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
                  >
                    <Scale size={14} /> Peso Inicial (kg)
                  </label>
                  <input
                    id="onboarding-screen-peso-inicial-kg"
                    type="number"
                    inputMode="decimal"
                    step="0.1"
                    required
                    className="form-input"
                    value={form.startWeight}
                    onChange={(e) => setForm({ ...form, startWeight: e.target.value })}
                  />
                </div>
                <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
                  <label htmlFor="onboarding-screen-peso-objetivo-kg" className="form-label">
                    Peso Objetivo (kg)
                  </label>
                  <input
                    id="onboarding-screen-peso-objetivo-kg"
                    type="number"
                    inputMode="decimal"
                    step="0.1"
                    required
                    className="form-input"
                    value={form.goalWeight}
                    onChange={(e) => setForm({ ...form, goalWeight: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label
                  htmlFor="onboarding-screen-actividad"
                  className="form-label"
                  style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
                >
                  <Activity size={14} /> Actividad
                </label>
                <select
                  id="onboarding-screen-actividad"
                  className="form-input"
                  value={form.activityFactor}
                  onChange={(e) => setForm({ ...form, activityFactor: e.target.value })}
                >
                  <option value="1.2">Sedentario</option>
                  <option value="1.375">Ligero</option>
                  <option value="1.55">Moderado</option>
                  <option value="1.725">Alto</option>
                  <option value="1.9">Muy Alto</option>
                </select>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={handlePreviousStep}
                  style={{ flex: 1, padding: '0.875rem' }}
                >
                  Atrás
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={loading}
                  style={{ flex: 2, padding: '0.875rem' }}
                >
                  {withNutrition ? 'Continuar' : loading ? 'Guardando…' : 'Empezar'}
                </button>
              </div>
            </form>
          </>
        ) : step === 2 ? (
          <>
            <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 700, margin: '0 0 0.5rem 0' }}>
                Configura tus Comidas
              </h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', margin: 0 }}>
                ¿Cuántas comidas haces al día normalmente?
              </p>
            </div>

            <form
              onSubmit={handleNextStep}
              style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}
            >
              <div
                onClick={() => setMealOption('default')}
                style={{
                  padding: '1rem',
                  border:
                    mealOption === 'default'
                      ? '2px solid var(--accent-primary)'
                      : '1px solid var(--border-medium)',
                  borderRadius: '12px',
                  background: mealOption === 'default' ? 'var(--accent-glow)' : 'var(--bg-card)',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
              >
                <div style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>
                  Por defecto (Recomendado)
                </div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  4 comidas: Desayuno, Comida, Cena y Snacks.
                </div>
              </div>

              <div
                onClick={() => setMealOption('custom')}
                style={{
                  padding: '1rem',
                  border:
                    mealOption === 'custom'
                      ? '2px solid var(--accent-primary)'
                      : '1px solid var(--border-medium)',
                  borderRadius: '12px',
                  background: mealOption === 'custom' ? 'var(--accent-glow)' : 'var(--bg-card)',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
              >
                <div style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>
                  Personalizado
                </div>
                <div
                  style={{
                    fontSize: '0.85rem',
                    color: 'var(--text-secondary)',
                    marginBottom: '8px',
                  }}
                >
                  Elige el número de comidas y las llamaremos "Comida 1", "Comida 2", etc.
                </div>
                {mealOption === 'custom' && (
                  <input
                    type="number"
                    className="form-input"
                    value={customMealsCount}
                    onChange={(e) => setCustomMealsCount(parseInt(e.target.value) || 1)}
                    min={1}
                    max={10}
                    style={{ width: '100px' }}
                  />
                )}
              </div>

              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={handlePreviousStep}
                  style={{ flex: 1, padding: '0.875rem' }}
                >
                  Atrás
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ flex: 2, padding: '0.875rem' }}
                >
                  Continuar
                </button>
              </div>
            </form>
          </>
        ) : step === 3 ? (
          <>
            <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 700, margin: '0 0 0.5rem 0' }}>
                {
                  {
                    lose: 'Plan para perder peso',
                    maintain: 'Plan para mantener tu peso',
                    gain: 'Plan para ganar peso',
                  }[
                    weightGoal(parseNumber(form.startWeight), parseNumber(form.goalWeight)) ??
                      'lose'
                  ]
                }
              </h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', margin: 0 }}>
                Ajusta tu plazo y actividad diaria para calcular tus calorías.
              </p>
            </div>

            <WeightLossPlan
              initialWeightKg={String(form.startWeight)}
              initialGoalWeight={String(form.goalWeight)}
              age={form.age}
              heightCm={form.heightCm}
              sex={form.sex as 'M' | 'F'}
              activityFactor={form.activityFactor}
              onSave={handleSavePlan}
              saveButtonText="Guardar y Continuar"
            />

            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={handlePreviousStep}
                style={{ width: '100%', padding: '0.875rem' }}
              >
                Atrás
              </button>
            </div>
          </>
        ) : (
          <>
            <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 700, margin: '0 0 0.5rem 0' }}>
                Estrategia de Macros
              </h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', margin: 0 }}>
                Elige cómo quieres repartir tus {Math.round(Number(form.kcal))} kcal.
              </p>
            </div>

            <form
              onSubmit={handleSubmit}
              style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}
            >
              <MacroConfigurator
                form={form}
                setForm={setForm as unknown as React.Dispatch<React.SetStateAction<MacroForm>>}
              />

              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={handlePreviousStep}
                  style={{ flex: 1, padding: '0.875rem' }}
                >
                  Atrás
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ flex: 2, padding: '0.875rem' }}
                  disabled={loading}
                >
                  {loading ? 'Guardando...' : 'Finalizar y Empezar'}
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
}

const ACTIVITY_LABELS: Record<string, string> = {
  '1.2': 'Sedentario',
  '1.375': 'Ligero',
  '1.55': 'Moderado',
  '1.725': 'Alto',
  '1.9': 'Muy alto',
};

function PrefilledStart({
  coachName,
  profile,
  modules,
  loading,
  onConfirm,
  onReview,
}: {
  coachName: string;
  profile: InvitationProfile;
  modules: AppModules;
  loading: boolean;
  onConfirm: (e: React.FormEvent) => void;
  onReview: () => void;
}) {
  const rows = [
    profile.sex && ['Sexo', profile.sex === 'M' ? 'Hombre' : 'Mujer'],
    profile.age != null && ['Edad', `${profile.age} años`],
    profile.heightCm != null && ['Altura', `${profile.heightCm} cm`],
    profile.startWeight != null && ['Peso', `${profile.startWeight} kg`],
    profile.goalWeight != null && ['Objetivo', `${profile.goalWeight} kg`],
    profile.activityFactor != null && [
      'Actividad',
      ACTIVITY_LABELS[String(profile.activityFactor)] ?? String(profile.activityFactor),
    ],
    ['Usarás', APP_MODULE_OPTIONS.find((o) => o.value === modules)?.label ?? 'Todo'],
  ].filter((row): row is [string, string] => Array.isArray(row));

  return (
    <form onSubmit={onConfirm} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <div style={{ textAlign: 'center' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 700, margin: '0 0 0.5rem 0' }}>
          Bienvenido a Ascension
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', margin: 0 }}>
          {coachName} ya ha rellenado tus datos. Revísalos y empieza.
        </p>
      </div>
      <dl
        style={{
          display: 'grid',
          gridTemplateColumns: 'auto 1fr',
          gap: '0.5rem 1rem',
          margin: 0,
        }}
      >
        {rows.map(([label, value]) => (
          <div key={label} style={{ display: 'contents' }}>
            <dt style={{ color: 'var(--text-secondary)' }}>{label}</dt>
            <dd style={{ margin: 0, fontWeight: 600 }}>{value}</dd>
          </div>
        ))}
      </dl>
      <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: 0 }}>
        Tu entrenador te pautará el plan. Puedes cambiar estos datos cuando quieras en Ajustes.
      </p>
      <div style={{ display: 'flex', gap: '0.5rem' }}>
        <button
          type="button"
          className="btn btn-secondary"
          onClick={onReview}
          style={{ flex: 1, padding: '0.875rem' }}
        >
          Cambiar datos
        </button>
        <button
          type="submit"
          className="btn btn-primary"
          disabled={loading}
          style={{ flex: 2, padding: '0.875rem' }}
        >
          {loading ? 'Guardando...' : 'Empezar'}
        </button>
      </div>
    </form>
  );
}
