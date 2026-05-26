#!/usr/bin/env node
// scripts/migrate-v2.js
// Migración idempotente del db.json existente para incorporar la "Fase II":
//   - Agrega campo `fase: "I"` a categorías y productos que no lo tengan.
//   - Inserta las 3 categorías nuevas (hospitalarias, industriales, municipales)
//     si no existen.
//   - Inserta los 3 productos nuevos (bacvita, simbiotica, respiro) si no existen.
//   - Agrega bloque `siteContent.conceptos` y los campos de Fase II en
//     siteContent si faltan.
//
// Uso:
//   node scripts/migrate-v2.js                    # migra ./data/db.json
//   node scripts/migrate-v2.js /ruta/a/db.json    # migra archivo específico
//
// Hace backup automático del archivo original antes de escribir.

const fs = require('fs');
const path = require('path');

const TARGET = process.argv[2] || path.join(__dirname, '..', 'data', 'db.json');

if (!fs.existsSync(TARGET)) {
  console.error(`[migrate-v2] No existe: ${TARGET}`);
  console.error('Si la app nunca arrancó en este entorno, simplemente inicia el servidor y se generará con los defaults nuevos (que ya incluyen Fase II).');
  process.exit(1);
}

// Backup
const backup = `${TARGET}.bak-${new Date().toISOString().replace(/[:.]/g, '-')}`;
fs.copyFileSync(TARGET, backup);
console.log(`[migrate-v2] Backup creado: ${backup}`);

const db = JSON.parse(fs.readFileSync(TARGET, 'utf8'));
let changes = 0;

// 1) siteContent: campos de Fase II + conceptos
db.siteContent = db.siteContent || {};
const sc = db.siteContent;
const siteDefaults = {
  faseIITitle: 'Fase II — Plantas de Tratamiento',
  faseIIIntro: 'Hemos decidido enfocarnos en plantas de tratamiento hospitalarias, industriales y municipales. En esta sección encontrarán productos dirigidos a cada área.',
  faseITitle: 'Fase I — Línea Histórica',
  faseISubtitle: 'Nuestra línea original de productos biotecnológicos para hogar, agricultura y sector hospitalario.',
  conceptosTitle: 'Concepto de Negocio',
  conceptosIntro: 'Un concepto de negocio describe la visión simplificada de una oportunidad de mercado: cómo una empresa crea, entrega y captura valor de manera única.'
};
for (const [k, v] of Object.entries(siteDefaults)) {
  if (sc[k] === undefined) { sc[k] = v; changes++; console.log(`[migrate-v2] siteContent.${k} agregado`); }
}

if (!sc.conceptos) {
  sc.conceptos = {
    mercado: { titulo: 'Mercado', icon: 'fa-bullseye', texto: '¿Quién es nuestro cliente ideal y qué problema específico le estamos resolviendo?' },
    oferta: { titulo: 'Oferta', icon: 'fa-box-open', texto: '¿Qué productos o servicios entregamos para satisfacer esa necesidad de forma única?' },
    distribucion: { titulo: 'Distribución', icon: 'fa-truck', texto: '¿A través de qué canales y procesos hacemos llegar nuestra solución a manos del cliente?' },
    produccion: { titulo: 'Producción', icon: 'fa-industry', texto: '¿Cómo transformamos nuestros recursos y tecnología en el producto final que entregamos?' },
    modelo: { titulo: 'Modelo de Negocio', icon: 'fa-chart-line', texto: '¿Cómo capturamos valor económico y aseguramos la viabilidad financiera de la operación?' }
  };
  changes++;
  console.log('[migrate-v2] siteContent.conceptos agregado');
}

// 2) categorías existentes → fase: 'I'
db.categories = db.categories || [];
db.categories.forEach(c => {
  if (!c.fase) { c.fase = 'I'; changes++; console.log(`[migrate-v2] categoría "${c.id}" → fase: I`); }
});

// 3) categorías nuevas (Fase II)
const newCategories = [
  { id: 'hospitalarias', name: 'Plantas de Tratamiento Hospitalarias', description: 'Soluciones microbiológicas para PTAR de hospitales y centros de salud.', icon: 'fa-hospital-user', order: 1, fase: 'II' },
  { id: 'industriales', name: 'Plantas de Tratamiento Industriales', description: 'Soluciones para condominios, parques industriales mixtos e industria textil.', icon: 'fa-industry', order: 2, fase: 'II' },
  { id: 'municipales', name: 'Plantas de Tratamiento Municipales', description: 'Control biológico de olores en PTAR municipales, lagunas y drenajes.', icon: 'fa-city', order: 3, fase: 'II' }
];
newCategories.forEach(nc => {
  if (!db.categories.find(c => c.id === nc.id)) {
    db.categories.push(nc);
    changes++;
    console.log(`[migrate-v2] categoría nueva "${nc.id}" agregada`);
  }
});

// 4) productos existentes → fase: 'I'
db.products = db.products || [];
db.products.forEach(p => {
  if (!p.fase) { p.fase = 'I'; changes++; console.log(`[migrate-v2] producto "${p.id}" → fase: I`); }
});

// 5) productos nuevos (Fase II)
const newProducts = [
  {
    id: 'bacvita',
    category: 'hospitalarias',
    fase: 'II',
    name: 'BacVita',
    subtitle: 'Solución microbiológica en polvo para PTAR hospitalarias',
    description: 'BacVita es una formulación microbiológica en polvo para PTAR hospitalarias, desarrollada con consorcios de Bacillus seleccionados para reforzar la actividad biológica del sistema. Su aplicación bajo protocolo técnico busca mejorar la estabilidad operativa de la planta, apoyar la degradación de carga orgánica y contribuir al manejo de compuestos residuales complejos presentes en aguas hospitalarias, como trazas farmacéuticas, antimicrobianos, detergentes o desinfectantes, sin sustituir la operación adecuada de la PTAR ni prometer cumplimiento automático.',
    format: 'Polvo, 500 g',
    benefits: ['Refuerza actividad biológica del sistema', 'Apoya la degradación de carga orgánica compleja', 'Contribuye al manejo de trazas farmacéuticas y desinfectantes'],
    productImage: '',
    logoImage: '',
    order: 1,
    justificacion: 'El concepto nace de una brecha clara en hospitales: las aguas residuales no llegan separadas por área, sino mezcladas en una sola red hidrosanitaria, incorporando descargas de cocina, lavandería, baños, laboratorios, quirófanos y áreas de limpieza. Esto genera una corriente más compleja que el agua residual doméstica común, con presencia potencial de carga orgánica, grasas, sólidos, nutrientes, desinfectantes, residuos farmacéuticos, antibióticos y microorganismos resistentes.\n\nLa oportunidad también se refuerza por el tipo de contaminantes asociados al sector salud. La OMS reconoce que los residuos de establecimientos de salud pueden incluir productos farmacéuticos, antibióticos, químicos de desinfección y microorganismos resistentes; y la EPA identifica los contaminantes emergentes en aguas residuales como un tema relevante de investigación ambiental.\n\nPor eso, BacVita se propone como una formulación microbiológica en polvo para PTAR hospitalarias, diseñada para fortalecer la actividad biológica del sistema, apoyar la degradación de carga orgánica y contribuir al manejo de compuestos residuales complejos bajo un protocolo técnico de aplicación. No sustituye la PTAR, no garantiza cumplimiento normativo automático y no promete eliminar todos los contaminantes; su valor está en ayudar a que una planta existente opere con mayor estabilidad frente a una corriente hospitalaria compleja.',
    loQueBusca: 'BacVita promueve reforzar la actividad biológica de PTAR hospitalarias existentes mediante una formulación microbiológica en polvo basada en consorcios de Bacillus. Su función central es apoyar la degradación de carga orgánica y mejorar la estabilidad operativa del sistema, especialmente en plantas que enfrentan corrientes complejas con residuos de limpieza, desinfectantes, nutrientes, grasas, sólidos y posibles trazas farmacéuticas. También promueve una forma de uso más ordenada: diagnóstico inicial, protocolo de aplicación, capacitación, bitácora operativa y seguimiento técnico.',
    loQueValida: 'El piloto valida si BacVita funciona bajo las condiciones reales de esa PTAR. Esto incluye revisar el agua de entrada, condiciones de operación, pH, aireación, carga orgánica, presencia de químicos/desinfectantes, punto de aplicación y cambios antes/después en parámetros seleccionados.\n\nLas bacterias no funcionan igual en cualquier corriente; dependen de la composición del agua, pretratamiento, oxigenación, pH y estabilidad de carga. Por eso el piloto no es "hacer mil pruebas", sino confirmar que la planta tiene condiciones mínimas para que el producto aporte valor.',
    loQueNoPromete: 'BacVita no promete eliminación total de antibióticos, remoción completa de fármacos, desinfección, eliminación de patógenos, reducción garantizada de resistencia antimicrobiana ni cumplimiento normativo automático. Su desempeño depende de la composición del efluente, operación de la PTAR, punto de aplicación, dosis y seguimiento técnico.'
  },
  {
    id: 'simbiotica',
    category: 'industriales',
    fase: 'II',
    name: 'Simbiótica',
    subtitle: 'Solución microbiológica en polvo para PTAR de condominios, parques industriales mixtos e industria textil',
    description: 'Simbiótica es una solución microbiológica en polvo para plantas de tratamiento de aguas residuales (PTAR) de condominios y complejos habitacionales, parques industriales mixtos e industria textil, desarrollada con consorcios de Bacillus seleccionados para fortalecer la actividad biológica del sistema. Su aplicación ayuda a estabilizar la operación del reactor biológico, acelerar la degradación de la fracción biodegradable de la carga orgánica (DBO5 y porción de la DQO), apoyar el control de surfactantes y olores, y reducir la dependencia operativa de insumos químicos auxiliares, dentro de un esquema técnico de aplicación, monitoreo y seguimiento.',
    format: 'Polvo',
    benefits: ['Degrada DBO₅ y fracción biodegradable de DQO', 'Controla surfactantes y olores', 'Reduce dependencia de insumos químicos auxiliares'],
    productImage: '',
    logoImage: '',
    order: 2,
    justificacion: 'El concepto nace de tres brechas convergentes en el mercado guatemalteco. Primero, los condominios y complejos habitacionales medianos y grandes operan PTAR domésticas que reciben aguas residenciales (servicios sanitarios, lavandería, cocina, áreas comunes) con cargas variables según ocupación, fines de semana y temporada; son operadas por administraciones que rara vez tienen personal técnico dedicado, lo que se traduce en olores, lodos acumulados, quejas vecinales y reportes mensuales irregulares al MARN.\n\nSegundo, los parques industriales mixtos albergan tenants de rubros distintos cuya descarga al PTAR común es heterogénea (oficinas, bodegas, maquilas livianas, centros de distribución, talleres) y la operación de la PTAR comunal sufre por la imprevisibilidad de la mezcla. Tercero, la industria textil guatemalteca, agrupada en VESTEX (Comisión de Vestuario y Textiles de Agexport), enfrenta un efluente especialmente complejo por la presencia de colorantes, surfactantes, alta alcalinidad y temperatura elevada.\n\nA nivel técnico, las aguas residuales de estos tres segmentos tienen perfiles distintos. Las PTAR de condominios manejan agua doméstica con DBO5 típica entre 200 y 400 mg/L, DQO entre 400 y 800 mg/L, alta biodegradabilidad y carga relativamente estable. Las PTAR de parques industriales mixtos manejan una mezcla difícil de caracterizar a priori: domésticos del personal + procesos ligeros de los tenants, con caudales y picos variables. La industria textil presenta un perfil más demandante: un caso documentado de planta textil en Guatemala reportó 1,088 m³/día de efluente con DBO5 de 250 mg/L, DQO de 1,000 mg/L, sólidos suspendidos de 110 mg/L, pH de 10, 4,312 unidades Pt-Co de color y temperatura de 44°C (Repositorio UVG); sus aguas son generalmente deficientes en nutrientes (N y P), con alta salinidad, presencia de tintes biodegradables y refractarios, surfactantes y trazas de metales pesados (Sigmadaf, 2023).\n\nEn la práctica convencional, estas PTAR combinan tanque de igualación, tratamiento físico-químico con coagulantes (sulfato de aluminio, cloruro férrico, policloruro de aluminio) y floculantes (poliacrilamida) cuando la carga lo justifica, tratamiento biológico aerobio (lodos activados, aeración extendida, biodiscos, MBBR) y en casos de textil cumplimiento avanzado se usa MBR o tratamientos terciarios. El uso intensivo de coagulantes y floculantes químicos introduce iones metálicos al efluente, incrementa la conductividad, dificulta procesos biológicos posteriores y genera lodo químico con costo de disposición creciente (Adintus, 2025). Simbiótica se posiciona como un coadyuvante biológico que actúa en la etapa secundaria del tren de tratamiento para fortalecer la población bacteriana nativa, mejorar la remoción de DBO/DQO biodegradable y apoyar la degradación de surfactantes, sin sustituir la PTAR ni eliminar el uso de coagulantes/floculantes cuando estos sean técnicamente necesarios (especialmente en textil, donde los tintes refractarios requieren tratamiento físico-químico o terciario).\n\nEn Guatemala, el AG 236-2006 continúa siendo la referencia técnica vigente para descargas, reúso de aguas residuales y disposición de lodos, con las reformas y prórrogas introducidas por el AG 129-2015 y el AG 285-2022. Por ello, Simbiótica no se plantea como una garantía de cumplimiento normativo ni como sustituto de la PTAR, sino como un coadyuvante microbiológico medible para apoyar la estabilidad biológica, la degradación de carga orgánica biodegradable y el control operativo de olores y lodos en PTAR existentes de condominios, parques industriales mixtos y textileras.',
    alcancePreliminar: 'Se propone como un paquete técnico, no solo como producto en polvo. Incluye: (1) Producto microbiológico en polvo basado en consorcios de Bacillus; (2) Diagnóstico inicial de elegibilidad, para verificar si la PTAR tiene condiciones mínimas (oxigenación, pH, tiempos de retención, ausencia de tóxicos inhibidores) para aplicar el producto; (3) Protocolo de aplicación, con dosis preliminar de choque y mantenimiento a validar en piloto; (4) Reporte técnico del piloto, con resultados, límites de uso y recomendación para continuidad (Antes/Después); (5) Capacitación básica al operador, enfocada en manipulación, hidratación, aplicación y registro del producto en polvo; (6) Bitácora operativa, para documentar dosis, frecuencia, condiciones de la planta y observaciones.',
    loQueBusca: 'Simbiótica busca apoyar la estabilidad biológica de PTAR existentes en tres segmentos: condominios, parques industriales mixtos e industria textil. Contribuir a la degradación de carga orgánica biodegradable medible en términos de DBO5 y la porción biodegradable de la DQO, apoyar la digestión de surfactantes y residuos de limpieza, y evaluar mediante piloto su efecto sobre la generación de lodos y el control de olores asociados a procesos anaerobios indeseados (sulfuro de hidrógeno, ácidos orgánicos volátiles). En textil, contribuye específicamente a la etapa biológica del tren, no a la remoción de color ni de tintes refractarios.',
    loQueValida: 'La magnitud de la reducción de DBO5, DQO biodegradable, SST y de la mejora en parámetros operativos debe tratarse como hipótesis técnica del piloto, no como garantía comercial inicial. La eficacia depende fuertemente del segmento (condominio vs. parque mixto vs. textil), de la composición real del efluente, del diseño y operación de la PTAR existente, del tiempo de retención hidráulico, de la concentración de oxígeno disuelto, del pH, de la presencia de tóxicos y del punto de aplicación. La literatura reporta reducciones de DBO5 superiores al 95% en condiciones de laboratorio y piloto con consorcios de Bacillus aplicados a aguas industriales (Springer Nature, 2020; Frontiers, 2023), pero esos números no son extrapolables sin un piloto en sitio. En el caso específico de textil, la remoción biológica eficaz aplica a la fracción biodegradable; los tintes refractarios requieren otro tipo de tratamiento (físico-químico, electrocoagulación, ozono, membranas) que Simbiótica no sustituye.',
    loQueNoPromete: 'Simbiótica no promete cumplimiento normativo automático ni sustituye la PTAR, ni elimina el uso de coagulantes/floculantes cuando estos sean técnicamente necesarios (especialmente en textil). No remueve color ni tintes refractarios.'
  },
  {
    id: 'respiro',
    category: 'municipales',
    fase: 'II',
    name: 'Respiro',
    subtitle: 'Solución microbiológica en polvo para control de olores en PTAR',
    description: 'Respiro es una solución biotecnológica dirigida inicialmente a plantas de tratamiento de aguas residuales municipales (PTAR), lagunas de oxidación, drenajes y sistemas de saneamiento urbano con problemas de malos olores. Su función es reducir el olor desde su origen mediante microorganismos benéficos que ayudan a acelerar la degradación de materia orgánica y a disminuir compuestos asociados al mal olor, como sulfuro de hidrógeno H₂S, amonio, metano y nitritos. A diferencia de un aromatizante o neutralizador superficial, Respiro no busca "tapar" el olor, sino mejorar las condiciones biológicas del sistema para reducir la generación de gases ofensivos.',
    format: 'Polvo, 1 kg',
    benefits: ['Reduce H₂S y gases de mal olor', 'Degrada materia orgánica acumulada', 'Compatible con lagunas de oxidación y drenajes municipales'],
    productImage: '',
    logoImage: '',
    order: 3,
    justificacion: 'La idea de Respiro surge a partir de la comparación entre dos realidades observadas en campo. En una PTAR municipal del área de Santa Catarina Pinula, el mal olor era perceptible desde varias cuadras antes de llegar y afectaba directamente a la población cercana. Esto evidenció que el problema de olores no es solamente técnico, sino también social, ambiental y de imagen municipal. En contraste, la visita a la PTAR de Cayalá mostró que una planta bien gestionada, con adecuada oxigenación y apoyo biológico, puede operar sin olores ofensivos. Esta comparación permitió validar la oportunidad de Respiro como una solución enfocada en reducir malos olores desde su causa y mejorar la convivencia urbana alrededor de sistemas de tratamiento.\n\nEstadísticas e insights que refuerzan el concepto:\n\n1. Guatemala ya reconoce el olor como problema ambiental. La Iniciativa 6680 propone una "Ley para la Gestión de la Contaminación por Olores".\n\n2. El MARN ya permite denunciar malos olores. En SICODA, la categoría "Aire" incluye "Malos Olores, Gases, Humo, Polvo, Partículas".\n\n3. San Miguel Petapa evidencia el problema social: más de 800 vecinos de Los Álamos conviven con aguas negras, malos olores, zancudos y contaminación, lo que demuestra que el problema de las aguas residuales afecta directamente la calidad de vida de las comunidades cercanas (Prensa Libre, 2026).\n\n4. Caso Villa Canales, aldea Chichimecas: alrededor de 6,000 pobladores han sido afectados por malos olores y aguas residuales, evidenciando cómo una falla en drenajes o tratamiento puede convertirse en un problema social para comunidades completas (Nuestro Diario, 2026).',
    loQueBusca: 'Respiro busca ayudar a las municipalidades a reducir malos olores generados en PTAR, lagunas de oxidación, drenajes o puntos críticos de saneamiento urbano. Su propósito es mejorar la operación biológica del sistema, reducir quejas vecinales, disminuir presión social sobre la municipalidad y recuperar la confianza ciudadana en la gestión ambiental local. En términos prácticos, Respiro busca convertir un problema invisible para muchos decisores, pero evidente para los vecinos, en una oportunidad de mejora técnica y reputacional para la municipalidad.',
    loQueValida: 'La reducción de olores, H₂S, amonio, nitritos, metano, carga orgánica o lodos debe tratarse como una hipótesis técnica del piloto, no como una promesa comercial absoluta. Los resultados dependerán del tipo de sistema, caudal, carga orgánica, oxigenación, tiempo de retención, punto de aplicación, frecuencia de dosificación, operación de la planta y condiciones reales del agua residual.\n\nPor eso, Respiro debe validarse mediante pilotos con medición antes/después, idealmente incluyendo percepción de olor, observaciones operativas y, cuando sea posible, parámetros técnicos como H₂S, DBO, DQO, amonio, sólidos o lodos.',
    loQueNoPromete: 'Respiro no debe prometer eliminación total de olores, cumplimiento normativo automático, remoción total de contaminantes, desinfección, eliminación de patógenos, acción bactericida ni sustitución de una PTAR bien diseñada y operada. Tampoco debe presentarse como solución única para plantas colapsadas, sin oxigenación, sin mantenimiento o con fallas estructurales graves. En esos casos, Respiro puede ser un apoyo biológico, pero no reemplaza la operación, mantenimiento, aireación, limpieza, monitoreo ni correcciones técnicas del sistema.'
  }
];
newProducts.forEach(np => {
  if (!db.products.find(p => p.id === np.id)) {
    db.products.push(np);
    changes++;
    console.log(`[migrate-v2] producto nuevo "${np.id}" agregado`);
  }
});

if (changes === 0) {
  console.log('[migrate-v2] Sin cambios — el db.json ya está en formato Fase II.');
  // Eliminamos el backup huérfano
  fs.unlinkSync(backup);
  process.exit(0);
}

fs.writeFileSync(TARGET, JSON.stringify(db, null, 2));
console.log(`[migrate-v2] Migración completada (${changes} cambios). Archivo: ${TARGET}`);
