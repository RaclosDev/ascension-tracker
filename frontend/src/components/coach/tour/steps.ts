export interface CoachTourStep {
  id: string;
  chapter: string;
  title: string;
  body: string;
  path: string;
  target: string;
  prepare?: { click: string; until: string }[];
}

/** The week already has sessions: on the calendar, or in the athlete preview that replaces it. */
const PLANNED =
  '.cal-week[data-focus] .cal-session:not([data-state="free"]), [aria-label="Vista previa del programa"]';

export const COACH_TOUR_STEPS: CoachTourStep[] = [
  {
    id: 'home',
    chapter: 'Día a día',
    title: 'Tu punto de partida',
    body: 'Este es el Inicio real del entrenador. Tres columnas te dicen qué vence: semanas por entregar, quién registra y seguimientos por responder. El recorrido carga atletas de ejemplo.',
    path: '/entrenador',
    target: '.coach-home-columns',
  },
  {
    id: 'go-clients',
    chapter: 'Día a día',
    title: 'Abre Atletas',
    body: 'Este botón lleva a tu lista de atletas. Pulsa la zona resaltada o Siguiente para abrir esa pantalla.',
    path: '/entrenador',
    target: '[data-tour-nav="/entrenador/atletas"]',
  },
  {
    id: 'invite',
    chapter: 'Día a día',
    title: 'Invita desde aquí',
    body: 'Invitar atleta abre el formulario de incorporación: nombre, servicios y datos iniciales. Después compartes el enlace; el atleta acepta y decide qué permisos te concede.',
    path: '/entrenador/atletas',
    target: '[data-tour="invite-client"]',
  },
  {
    id: 'roster',
    chapter: 'Día a día',
    title: 'Encuentra a quien necesita seguimiento',
    body: 'El filtro y el orden por prioridad te ayudan a revisar tu cartera. Cada fila muestra la semana siguiente, el último registro y el siguiente paso con ese atleta.',
    path: '/entrenador/atletas',
    target: '[aria-label="Filtrar atletas"]',
  },
  {
    id: 'open-client',
    chapter: 'Día a día',
    title: 'Entra en la ficha de Lucía',
    body: 'Pulsa su nombre para trabajar con ella. Abriremos su ficha y recorreremos sus pestañas, como harías con un atleta.',
    path: '/entrenador/atletas',
    target: 'a[href*="/atletas/tour-lucia?"]',
  },
  {
    id: 'client-tabs',
    chapter: 'Planificar una semana',
    title: 'Las pestañas de cada atleta',
    body: 'Entrenamiento abre el calendario del atleta: cada día con su sesión, lo que registró y su nutrición. Las demás pestañas separan nutrición, progreso, seguimientos y gestión. Dependen de los servicios y permisos.',
    path: '/entrenador/atletas/tour-lucia?seccion=semana',
    target: '.athlete-nav .athlete-tabs',
  },
  {
    id: 'review',
    chapter: 'Planificar una semana',
    title: 'Lee el feedback antes de planificar',
    body: 'A la izquierda tienes la semana que revisas: sueño, energía, respuestas y entrenamientos pautados y registrados. Desde aquí puedes abrir el seguimiento o consultar el historial.',
    path: '/entrenador/atletas/tour-lucia?seccion=semana&vista=revision',
    target: '[data-tour="week-review"]',
  },
  {
    id: 'copy',
    chapter: 'Planificar una semana',
    title: 'Copia la semana anterior',
    body: 'En «Copiar» está «Copiar semana anterior», que reutiliza la semana vigente del atleta. Después ajustas su copia. Al avanzar lo haremos en la pantalla real para mostrarte el editor.',
    path: '/entrenador/atletas/tour-lucia?seccion=semana',
    target: '[data-tour="copy-menu"]',
  },
  {
    id: 'prescription',
    chapter: 'Planificar una semana',
    title: 'Edita la prescripción aquí',
    body: 'Este es el editor real: al pulsar un día del calendario se abre su sesión, con cada ejercicio en una línea de series, repeticiones, esfuerzo y carga. La flecha despliega el serie a serie, la nota, el descanso y la superserie. Cada atleta recibe su propia adaptación.',
    path: '/entrenador/atletas/tour-lucia?seccion=semana',
    target: '[data-tour="exercise-prescription"]',
    prepare: [
      {
        click: '[data-tour="student-preview"][aria-pressed="true"]',
        until: '[data-tour="student-preview"][aria-pressed="false"]',
      },
      {
        click: '[data-tour="copy-week"]',
        until: PLANNED,
      },
      {
        // Coming back from the week settings, the day has to be opened again.
        click:
          '.cal-week[data-focus] .cal-cell:has(.cal-session:not([data-state="free"])) .cal-day',
        until: '[data-tour="exercise-prescription"]',
      },
    ],
  },
  {
    id: 'insert',
    chapter: 'Planificar una semana',
    title: 'Inserta una sesión guardada',
    body: 'En este bloque buscas sesiones o semanas por nombre, favoritos, material y duración. Eliges el día de destino y adaptas lo insertado.',
    path: '/entrenador/atletas/tour-lucia?seccion=semana',
    target: '[data-tour="library-insert"]',
    prepare: [
      {
        click: '[data-tour="student-preview"][aria-pressed="true"]',
        until: '[data-tour="student-preview"][aria-pressed="false"]',
      },
      {
        click: '[data-week-panel="library"][aria-pressed="false"]',
        until: '[data-week-panel="library"][aria-pressed="true"]',
      },
      {
        click: '[data-tour="library-insert"] > summary',
        until: '[data-tour="library-insert"][open]',
      },
    ],
  },
  {
    id: 'intent',
    chapter: 'Planificar una semana',
    title: 'Indica el objetivo de la semana',
    body: 'Marca progresión, mantenimiento, descarga, test o competición para explicar el propósito de los ajustes.',
    path: '/entrenador/atletas/tour-lucia?seccion=semana',
    target: '[data-tour="week-intent"]',
    prepare: [
      {
        click: '[data-week-panel="notes"][aria-pressed="false"]',
        until: '[data-week-panel="notes"][aria-pressed="true"]',
      },
    ],
  },
  {
    id: 'comment',
    chapter: 'Planificar una semana',
    title: 'Explica la semana al atleta',
    body: 'Escribe las indicaciones públicas: por ejemplo, qué priorizar en una descarga. Este comentario forma parte de la pauta del atleta.',
    path: '/entrenador/atletas/tour-lucia?seccion=semana',
    target: '[data-tour="week-comment"]',
    prepare: [
      {
        click: '[data-week-panel="notes"][aria-pressed="false"]',
        until: '[data-week-panel="notes"][aria-pressed="true"]',
      },
    ],
  },
  {
    id: 'private',
    chapter: 'Planificar una semana',
    title: 'Guarda tus notas privadas',
    body: 'Este espacio es para tus observaciones y decisiones internas. Las notas privadas no forman parte de la pauta que ve el atleta.',
    path: '/entrenador/atletas/tour-lucia?seccion=semana',
    target: '[data-tour="week-private"]',
    prepare: [
      {
        click: '[data-week-panel="notes"][aria-pressed="false"]',
        until: '[data-week-panel="notes"][aria-pressed="true"]',
      },
      {
        click: '[data-tour="week-private"] > summary',
        until: '[data-tour="week-private"][open]',
      },
    ],
  },
  {
    id: 'preview-control',
    chapter: 'Planificar una semana',
    title: 'Comprueba la vista del atleta',
    body: 'Este botón cambia el editor por la vista previa. Al avanzar la abriremos para comprobar cómo se presentan las sesiones y sus indicaciones.',
    path: '/entrenador/atletas/tour-lucia?seccion=semana',
    target: '[data-tour="student-preview"]',
    prepare: [
      {
        click: '[data-tour="student-preview"][aria-pressed="true"]',
        until: '[data-tour="student-preview"][aria-pressed="false"]',
      },
      {
        click: '[data-tour="copy-week"]',
        until: PLANNED,
      },
    ],
  },
  {
    id: 'preview',
    chapter: 'Planificar una semana',
    title: 'Así se presenta la pauta',
    body: 'Esta es la vista previa real del programa. Revisa sesiones, cargas e indicaciones antes de publicar. Tus notas privadas no aparecen aquí.',
    path: '/entrenador/atletas/tour-lucia?seccion=semana',
    target: '[aria-label="Vista previa del programa"]',
    prepare: [
      {
        click: '[data-tour="copy-week"]',
        until: PLANNED,
      },
      {
        click: '[data-tour="student-preview"]',
        until: '[aria-label="Vista previa del programa"]',
      },
    ],
  },
  {
    id: 'publish',
    chapter: 'Planificar una semana',
    title: 'Publica desde aquí',
    body: 'El borrador se guarda solo mientras trabajas. Publicar semana abre una confirmación con fechas, sesiones y series antes de entregarla. Durante el tour no publicamos nada.',
    path: '/entrenador/atletas/tour-lucia?seccion=semana',
    target: '[data-tour="week-publish"]',
  },
  {
    id: 'go-reviews',
    chapter: 'Seguimiento',
    title: 'Cambia a Seguimientos',
    body: 'Esta pestaña abre los seguimientos semanales de Lucía. Pulsa la zona señalada o Siguiente para ver su seguimiento.',
    path: '/entrenador/atletas/tour-lucia?seccion=semana',
    target: '.coach-client-nav [data-athlete-nav~="revisiones"]',
  },
  {
    id: 'checkin',
    chapter: 'Seguimiento',
    title: 'Responde con el contexto a la vista',
    body: 'Aquí lees valoraciones, respuestas y ampliaciones del atleta. Tu respuesta mantiene la conversación junto al seguimiento que estás revisando.',
    path: '/entrenador/atletas/tour-lucia?seccion=revisiones',
    target: '[data-tour="checkin-card"]',
  },
  {
    id: 'history-tab',
    chapter: 'Seguimiento',
    title: 'Abre el historial de entrenamiento',
    body: 'Entrenamientos reúne programas asignados y sesiones realizadas, incluidos entrenos libres. Vamos a cambiar a esa pestaña.',
    path: '/entrenador/atletas/tour-lucia?seccion=revisiones',
    target: '.coach-client-nav [data-athlete-nav~="entrenamiento"]',
  },
  {
    id: 'history',
    chapter: 'Seguimiento',
    title: 'Busca y revisa sesiones',
    body: 'Filtra por nombre u origen. Al abrir una sesión comparas lo pautado con las series registradas y revisas esfuerzo, notas y comentarios.',
    path: '/entrenador/atletas/tour-lucia?seccion=entrenamiento',
    target: '[data-tour="training-history"]',
  },
  {
    id: 'power-tab',
    chapter: 'Especialidades',
    title: 'Entra en Powerlifting',
    body: 'Esta pestaña se muestra cuando activas la especialidad en ese atleta. Veamos sus referencias y las áreas de competición y seguimiento.',
    path: '/entrenador/atletas/tour-lucia?seccion=entrenamiento',
    target: '.coach-client-nav [data-athlete-nav~="powerlifting"]',
  },
  {
    id: 'power',
    chapter: 'Especialidades',
    title: 'Perfil, competiciones y seguimiento S/B/D',
    body: 'Perfil y marcas contiene los TM y referencias. Competiciones separa preparación e intentos; Seguimiento S/B/D analiza las sesiones registradas.',
    path: '/entrenador/atletas/tour-lucia?seccion=powerlifting',
    target: '[aria-label="Áreas de powerlifting"]',
  },
  {
    id: 'nutrition-tab',
    chapter: 'Especialidades',
    title: 'Cambia a Nutrición',
    body: 'Si el atleta tiene ese servicio y comparte sus datos, esta pestaña permite trabajar su pauta y consultar los registros. Abrimos la sección de Lucía.',
    path: '/entrenador/atletas/tour-lucia?seccion=powerlifting',
    target: '.coach-client-nav [data-athlete-nav~="nutricion"]',
  },
  {
    id: 'nutrition',
    chapter: 'Especialidades',
    title: 'Prepara la pauta nutricional',
    body: 'Distingue objetivos de entreno y descanso, añade comidas y revisa la vista previa antes de publicar. Debajo está su diario de comidas, día a día.',
    path: '/entrenador/atletas/tour-lucia?seccion=nutricion',
    target: '[data-tour="nutrition-plan"]',
  },
  {
    id: 'progress',
    chapter: 'Seguimiento',
    title: 'Consulta el progreso compartido',
    body: 'En Progreso se reúnen peso, tendencias, pasos y fotos que comparte el atleta. Combina esos datos con su feedback y entrenamientos.',
    path: '/entrenador/atletas/tour-lucia?seccion=progreso',
    target: '.coach-client-content',
  },
  {
    id: 'management',
    chapter: 'Seguimiento',
    title: 'Adapta servicios y seguimientos',
    body: 'Ficha y gestión contiene objetivo, disponibilidad, servicios, agenda y permisos. Puedes ajustar cada incorporación sin cambiar la configuración de todos.',
    path: '/entrenador/atletas/tour-lucia?seccion=gestion',
    target: '.coach-client-content',
  },
  {
    id: 'go-library',
    chapter: 'Biblioteca',
    title: 'Abre tu biblioteca',
    body: 'Biblioteca reúne los recursos que reutilizas entre atletas. Vamos a salir de la ficha y entrar en esa sección.',
    path: '/entrenador/atletas/tour-lucia?seccion=gestion',
    target: '[data-tour-nav="/entrenador/planificacion"]',
  },
  {
    id: 'resources',
    chapter: 'Biblioteca',
    title: 'Cada recurso tiene su pestaña',
    body: 'Sesiones, semanas, programas, pautas de nutrición y recetas. Preparas el recurso una vez y con «Aplicar a…» lo llevas al atleta que elijas.',
    path: '/entrenador/planificacion',
    target: '.coach-library-tabs',
  },
  {
    id: 'programs-link',
    chapter: 'Biblioteca',
    title: 'Etiquetas, favoritos y más filtros',
    body: 'Este enlace abre la vista completa de entrenamiento, donde marcas favoritos y etiquetas. Admite sesiones sueltas y semanas: no necesitas preparar un ciclo largo.',
    path: '/entrenador/planificacion',
    target: 'a[href="/entrenador/programas"]',
  },
  {
    id: 'library-filters',
    chapter: 'Biblioteca',
    title: 'Encuentra tus recursos habituales',
    body: 'Busca por nombre o etiqueta y filtra por tipo, favoritos, material o duración para recuperar una sesión sin revisar todos tus programas.',
    path: '/entrenador/programas',
    target: '[data-tour="library-filters"]',
  },
  {
    id: 'create-session',
    chapter: 'Biblioteca',
    title: 'Crea una sesión reutilizable',
    body: 'Nueva sesión abre el editor para una sesión suelta. Los botones contiguos permiten crear una semana o un programa completo.',
    path: '/entrenador/programas',
    target: 'a[href="/entrenador/programas/nuevo?tipo=sesion"]',
  },
  {
    id: 'settings',
    chapter: 'Configuración',
    title: 'Prepara tu forma de trabajar',
    body: 'En Ajustes defines tu presentación profesional y los valores iniciales de las incorporaciones. Cada atleta puede tener su propia configuración.',
    path: '/entrenador/ajustes',
    target: '[data-tour="professional-settings"]',
  },
  {
    id: 'questions',
    chapter: 'Configuración',
    title: 'Personaliza el seguimiento',
    body: 'Aquí editas las preguntas comunes de tus seguimientos. Los avisos de nuevos seguimientos se configuran al lado y dependen de este dispositivo.',
    path: '/entrenador/ajustes',
    target: '[data-tour="checkin-template"]',
  },
  {
    id: 'subscription',
    chapter: 'Configuración',
    title: 'Tu plan está en Suscripción',
    body: 'Suscripción está en el menú de tu cuenta, al pie del lateral. Contiene tu plan, límites y opciones de contratación. El recorrido no realiza compras ni envía solicitudes.',
    path: '/entrenador/ajustes',
    target: '[data-tour-nav="/entrenador/plan"]',
  },
  {
    id: 'utilities',
    chapter: 'Configuración',
    title: 'Herramientas de apoyo',
    body: 'Utilidades reúne las calculadoras de la aplicación. Puedes volver a ellas cuando necesites hacer un cálculo durante la planificación.',
    path: '/utilities',
    target: '.main-content-inner',
  },
  {
    id: 'finish',
    chapter: 'Para terminar',
    title: 'Vuelve al tour cuando quieras',
    body: 'Tienes Tour en el menú de tu cuenta y accesos desde Inicio y Ajustes. Puedes repetir el recorrido o empezar por un capítulo. Al terminar volverás a tu cuenta.',
    path: '/entrenador',
    target: '[data-tour-nav="/entrenador/guia"]',
  },
];
