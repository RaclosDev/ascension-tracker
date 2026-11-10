/**
 * Draft legal texts, pending external legal review before launch. Bracketed fields are still to
 * be decided; CONTACT is replaced on screen by the contact email (or the in-app form).
 */
export type LegalDoc = 'privacidad' | 'terminos' | 'terminos-entrenadores';

interface LegalSection {
  title: string;
  paragraphs: string[];
}

export interface LegalText {
  title: string;
  version: string;
  sections: LegalSection[];
}

const LEGAL_VERSION = '2026-11-borrador';

export const CONTACT = '[CONTACTO]';

const owner = `Ascension es un proyecto independiente. Para cualquier duda sobre estos textos o sobre tus datos, escríbenos a ${CONTACT}.`;

export const LEGAL_TEXTS: Record<LegalDoc, LegalText> = {
  privacidad: {
    title: 'Política de privacidad',
    version: LEGAL_VERSION,
    sections: [
      { title: 'Responsable y contacto', paragraphs: [owner] },
      {
        title: 'Qué datos tratamos',
        paragraphs: [
          'Los de tu acceso: tu email y, según cómo entres, tu contraseña (guardada solo como hash, nunca en claro), la clave pública de tus llaves de acceso o el nombre y la foto de perfil de tu cuenta de Google.',
          'Lo que registras en la app: entrenamientos, comidas, peso, pasos, medidas, fotos de progreso, check-ins y ajustes. Varios de estos datos (peso, medidas, fotos, alimentación) son datos relativos a la salud.',
          'Si nos escribes desde el formulario de contacto, tu mensaje y el número de alumnos que nos indiques.',
          'Datos técnicos necesarios para que el servicio funcione y sea seguro: registros de acceso, dirección IP y suscripciones a avisos del navegador.',
        ],
      },
      {
        title: 'Para qué y con qué base',
        paragraphs: [
          'Para prestarte el servicio que pides al crear la cuenta (ejecución del contrato).',
          'Los datos de salud solo se tratan con tu consentimiento explícito, que das marcando una casilla específica al empezar y que queda registrado con la fecha y la versión de estos textos. El envío de tus comidas a la IA tiene su propia casilla. Puedes retirar ambos en cualquier momento en Ajustes > Datos y cuenta; además puedes borrar esos registros o tu cuenta.',
          'Si te vinculas con un entrenador, solo le compartimos lo que tú eliges (cuerpo, entrenamiento o nutrición) y puedes cambiarlo o terminar la relación cuando quieras.',
          'Para atender tus mensajes de contacto y, si eres entrenador, gestionar tu plan y sus pagos (ejecución del contrato y obligaciones legales de facturación).',
          'Para mantener la seguridad del servicio y evitar abusos (interés legítimo).',
        ],
      },
      {
        title: 'Inteligencia artificial',
        paragraphs: [
          'Cuando usas las funciones de IA (por ejemplo, analizar la foto de una etiqueta o de un plato), enviamos esa imagen o texto a Google Gemini para obtener la respuesta. No lo usamos para nada más.',
        ],
      },
      {
        title: 'Con quién los compartimos',
        paragraphs: [
          'Con proveedores que nos ayudan a prestar el servicio y actúan como encargados del tratamiento: Heroku (alojamiento de la aplicación), [PROVEEDOR DE BASE DE DATOS] (base de datos), Cloudflare R2 (fotos de progreso, en almacenamiento privado), Resend (envío de los correos de tu cuenta, como la verificación del email o el cambio de contraseña), Google (inicio de sesión con Google y Gemini) y los servicios de avisos del navegador que uses.',
          'Algunos están fuera del Espacio Económico Europeo; en esos casos las transferencias se amparan en las cláusulas contractuales tipo de la Comisión Europea o en el Marco de Privacidad de Datos UE-EE. UU.',
          'Con tu entrenador, solo si te vinculas y solo lo que tú compartes. No vendemos tus datos ni los usamos para publicidad.',
        ],
      },
      {
        title: 'Cuánto tiempo',
        paragraphs: [
          'Mientras tengas la cuenta. Al borrarla eliminamos tus registros y fotos. Los datos de facturación de los entrenadores se conservan el tiempo que exija la ley fiscal.',
        ],
      },
      {
        title: 'Tus derechos',
        paragraphs: [
          'Puedes acceder, rectificar, borrar, oponerte, limitar el tratamiento y llevarte tus datos. Desde Ajustes puedes descargar todos tus datos y borrar tu cuenta en cualquier momento. Para lo demás, escríbenos.',
          'Si crees que no hemos tratado bien tus datos, puedes reclamar ante la Agencia Española de Protección de Datos (aepd.es).',
        ],
      },
    ],
  },
  terminos: {
    title: 'Términos de uso',
    version: LEGAL_VERSION,
    sections: [
      { title: 'Contacto', paragraphs: [owner] },
      {
        title: 'El servicio',
        paragraphs: [
          'Ascension es una app para registrar entrenamientos, alimentación, peso y pasos. Para usarla como persona es gratuita. Los entrenadores tienen planes de pago con sus propias condiciones.',
          'La app no es un servicio médico. Los cálculos y sugerencias (incluidos los de la IA) son orientativos y pueden contener errores; consulta a un profesional sanitario antes de cambios importantes en tu dieta o actividad.',
        ],
      },
      {
        title: 'Tu cuenta',
        paragraphs: [
          'Entras con tu email y contraseña, con una llave de acceso o con tu cuenta de Google. Guarda tus credenciales en secreto: eres responsable de lo que se haga con tu cuenta. Debes tener al menos [EDAD MÍNIMA] años.',
          'No uses la app para fines ilícitos, para acceder a datos de otros sin permiso ni para sobrecargar el servicio. Podemos suspender cuentas que lo hagan.',
        ],
      },
      {
        title: 'Tus datos y tu contenido',
        paragraphs: [
          'Lo que registras es tuyo. Solo lo usamos para prestarte el servicio, tal como explica la política de privacidad. Puedes descargarlo y borrarlo cuando quieras.',
        ],
      },
      {
        title: 'Disponibilidad y cambios',
        paragraphs: [
          'Intentamos que el servicio esté siempre disponible, pero puede haber cortes o cambios. Si cambiamos estos términos de forma importante, te avisaremos en la app antes de que se apliquen.',
        ],
      },
      {
        title: 'Responsabilidad',
        paragraphs: [
          'En la medida que permita la ley, no respondemos de daños indirectos derivados del uso de la app ni de decisiones tomadas a partir de sus cálculos. Nada de esto limita tus derechos como consumidor.',
        ],
      },
      {
        title: 'Ley aplicable',
        paragraphs: [
          'Se aplica la ley española. Si eres consumidor, puedes acudir a los tribunales de tu domicilio.',
        ],
      },
    ],
  },
  'terminos-entrenadores': {
    title: 'Condiciones para entrenadores',
    version: LEGAL_VERSION,
    sections: [
      { title: 'Contacto', paragraphs: [owner] },
      {
        title: 'Planes y prueba',
        paragraphs: [
          'Al activar el modo entrenador empiezas una prueba gratuita de 14 días con el plan Pro, sin tarjeta. Al terminar pasas al plan gratis salvo que contrates otro.',
          'Cada plan tiene un límite de alumnos activos y una cuota diaria de IA, que se muestran en Plan y facturación. Si superas el límite no pierdes a ningún alumno, pero no podrás añadir más hasta que cambies de plan.',
        ],
      },
      {
        title: 'Pago',
        paragraphs: [
          'De momento el pago es por transferencia bancaria, mensual o anual (el anual cuesta diez mensualidades). El plan se activa hasta el día pagado y, si no se renueva, vuelve al gratis.',
          'Los precios publicados [INCLUYEN / NO INCLUYEN] impuestos. Emitiremos factura de cada pago.',
          'Puedes dejar de pagar cuando quieras; el plan sigue hasta el final del periodo pagado. No hay devolución de periodos ya empezados salvo que la ley lo exija.',
        ],
      },
      {
        title: 'Tus alumnos y sus datos',
        paragraphs: [
          'Cada alumno decide qué te comparte y puede retirarlo o terminar la relación cuando quiera. Usa sus datos solo para entrenarle y con la confidencialidad propia de tu profesión.',
          'Respecto a los datos de tus alumnos que tratas para tu servicio de entrenamiento, tú eres responsable del tratamiento y Ascension actúa como encargado según el anexo siguiente.',
        ],
      },
      {
        title: 'Anexo: encargo del tratamiento',
        paragraphs: [
          'Objeto: alojar y mostrar al entrenador los datos que sus alumnos le comparten (entrenamiento, nutrición, peso, medidas, fotos y check-ins), mientras dure la relación.',
          'Ascension solo trata esos datos siguiendo las instrucciones del entrenador que resultan del uso normal de la app, con personal sujeto a confidencialidad y con medidas de seguridad adecuadas (cifrado en tránsito, almacenamiento privado, acceso limitado al entrenador vinculado).',
          'El entrenador autoriza los subencargados indicados en la política de privacidad. Avisaremos de cualquier cambio con antelación para que pueda oponerse.',
          'Ascension ayudará al entrenador a atender los derechos de los alumnos y le avisará sin demora de cualquier brecha de seguridad que les afecte.',
          'Al terminar la relación o el encargo, el entrenador deja de ver esos datos; siguen siendo del alumno, que los conserva en su cuenta.',
        ],
      },
      {
        title: 'Planes a medida',
        paragraphs: [
          'Si necesitas más alumnos de los que permite el plan más alto, o eres un equipo o un gimnasio, escríbenos desde Plan y facturación y acordaremos las condiciones por escrito.',
        ],
      },
    ],
  },
};
