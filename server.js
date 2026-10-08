const express = require('express');
const session = require('express-session');
const bcrypt = require('bcryptjs');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// --- Carga de .env (sin dependencia externa) ---
// Lee pares KEY=VALOR del archivo .env en la raíz. No reemplaza valores ya
// definidos en el entorno. Soporta comentarios con #, comillas simples y dobles.
(function loadDotEnv() {
  const envPath = path.join(__dirname, '.env');
  if (!fs.existsSync(envPath)) return;
  fs.readFileSync(envPath, 'utf8').split(/\r?\n/).forEach(line => {
    if (!line || line.trim().startsWith('#')) return;
    const m = line.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*?)\s*$/i);
    if (!m) return;
    let v = m[2];
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
    if (!(m[1] in process.env)) process.env[m[1]] = v;
  });
})();

const app = express();
const PORT = parseInt(process.env.PORT, 10) || 6001;
// Credenciales iniciales SOLO para el primer arranque (cuando se crea data/db.json).
// Si ya existe db.json, se ignoran. En producción se recomienda definir
// ADMIN_INITIAL_PASSWORD en .env antes del primer arranque y cambiar la clave desde /admin.
const INITIAL_ADMIN_USER = process.env.ADMIN_INITIAL_USER || 'admin';
const INITIAL_ADMIN_PASS = process.env.ADMIN_INITIAL_PASSWORD || 'admin123';

// --- JSON-based DB ---
const DB_PATH = path.join(__dirname, 'data', 'db.json');

function loadDB() {
  if (!fs.existsSync(DB_PATH)) {
    const initial = {
      users: [
        { id: 1, username: INITIAL_ADMIN_USER, password: bcrypt.hashSync(INITIAL_ADMIN_PASS, 10), role: 'admin', createdAt: new Date().toISOString() }
      ],
      siteContent: {
        heroTitle: 'El futuro del agua ya está aquí',
        heroSubtitle: 'Transformamos el agua desde su origen.',
        heroDescription: 'Nuestras soluciones utilizan microorganismos especializados que eliminan residuos, malos olores y contaminación de forma natural, sin químicos agresivos.',
        heroTagline: 'Más eficiencia. Menos impacto. Mejores resultados.',
        heroImage: '/images/hero-bg.jpg',
        aboutTitle: 'Sobre Nosotros',
        aboutText: 'En EcoProduct desarrollamos soluciones biotecnológicas para el tratamiento de agua. Utilizamos consorcios microbianos especializados que ofrecen alternativas efectivas, sostenibles y seguras para el medio ambiente.',
        footerText: '© 2026 EcoProduct. Todos los derechos reservados.',
        whatsappNumber: '',
        contactEmail: 'info@ecoproduct.com',
        faseIITitle: 'Fase II — Plantas de Tratamiento',
        faseIIIntro: 'Hemos decidido enfocarnos en plantas de tratamiento hospitalarias, industriales y municipales. En esta sección encontrarán productos dirigidos a cada área.',
        faseITitle: 'Fase I — Línea Histórica',
        faseISubtitle: 'Nuestra línea original de productos biotecnológicos para hogar, agricultura y sector hospitalario.',
        conceptosTitle: 'Concepto de Negocio',
        conceptosIntro: 'Un concepto de negocio describe la visión simplificada de una oportunidad de mercado: cómo una empresa crea, entrega y captura valor de manera única.',
        conceptos: {
          mercado: { titulo: 'Mercado', icon: 'fa-bullseye', texto: '¿Quién es nuestro cliente ideal y qué problema específico le estamos resolviendo?' },
          oferta: { titulo: 'Oferta', icon: 'fa-box-open', texto: '¿Qué productos o servicios entregamos para satisfacer esa necesidad de forma única?' },
          distribucion: { titulo: 'Distribución', icon: 'fa-truck', texto: '¿A través de qué canales y procesos hacemos llegar nuestra solución a manos del cliente?' },
          produccion: { titulo: 'Producción', icon: 'fa-industry', texto: '¿Cómo transformamos nuestros recursos y tecnología en el producto final que entregamos?' },
          modelo: { titulo: 'Modelo de Negocio', icon: 'fa-chart-line', texto: '¿Cómo capturamos valor económico y aseguramos la viabilidad financiera de la operación?' }
        }
      },
      products: [
        {
          id: 'greendrain',
          category: 'greendrain',
          fase: 'I',
          name: 'DRENOVA',
          subtitle: 'Destapador Biológico de Caños',
          description: 'Fórmula líquida con cepas microbianas que descomponen cabello, grasa y residuos orgánicos que obstruyen los caños. Actúa en horas, sin corroer tuberías.',
          format: 'Botella de 1L, uso mensual preventivo',
          benefits: ['Elimina obstrucciones sin dañar tuberías PVC o metal', 'Reduce malos olores desde la primera aplicación', '100% biodegradable, seguro para ríos y suelos'],
          productImage: '/images/drenova-product.jpg',
          logoImage: '/images/drenova-logo.jpg',
          order: 1
        },
        {
          id: 'homebio',
          category: 'greendrain',
          fase: 'I',
          name: 'HOMEBIO',
          subtitle: 'Limpiador Biológico para Cocina y Baño',
          description: 'Líquido con enzimas y microorganismos que desintegran residuos de comida, jabón y grasa en lavamanos y lavaplatos. Sin cloro, sin ácidos, sin fumes tóxicos.',
          format: 'Líquido 400ml · Uso diario en cocina y baño',
          benefits: ['Desintegra grasa y residuos de comida eficazmente', 'Sin cloro, sin ácidos, aroma natural', 'Seguro para niños y mascotas'],
          productImage: '/images/homebio-product.jpg',
          logoImage: '/images/homebio-logo.jpg',
          order: 2
        },
        {
          id: 'septiclean',
          category: 'greendrain',
          fase: 'I',
          name: 'SEPTICLEAN',
          subtitle: 'Tratamiento para Fosas Sépticas',
          description: 'Inoculante en polvo con bacterias que reactivan el proceso natural de digestión en fosas sépticas, reduciendo lodos y malos olores.',
          format: 'Polvo, una cucharada',
          benefits: ['Elimina gases y olores sin ventilación especial', 'Extiende el tiempo entre vaciados de la fosa', 'Puede llegar a reducir hasta 60% la acumulación de lodos'],
          productImage: '/images/septiclean-product.jpg',
          logoImage: '/images/septiclean-logo.jpg',
          order: 3
        },
        {
          id: 'biogrease',
          category: 'agroflow',
          fase: 'I',
          name: 'BIOGREASE',
          subtitle: 'Tratamiento para Trampas de Grasa',
          description: 'Polvo concentrado con bacterias especializadas en degradar aceites y grasas en trampas domésticas, antes de que lleguen al drenaje municipal.',
          format: 'Polvo concentrado',
          benefits: ['Previene malos olores y obstrucciones severas', 'Reduce frecuencia de limpieza profesional', 'Puede llegar a degradar hasta 95% de grasa acumulada'],
          productImage: '/images/biogrease-product.jpg',
          logoImage: '/images/biogrease-logo.jpg',
          order: 4
        },
        {
          id: 'mielva',
          category: 'agroflow',
          fase: 'I',
          name: 'MIELVA',
          subtitle: 'Tratamiento Biológico para Aguas Mieles del Café',
          description: 'Solución microbiológica especializada para el tratamiento de aguas mieles generadas en beneficios húmedos de café. Diseñada para reducir la carga orgánica de forma natural y eficiente.',
          format: 'Polvo liofilizado',
          benefits: ['Tratamiento específico para aguas mieles', 'Remociones superiores al 80% de carga orgánica', 'Validado en el sector cafetalero'],
          productImage: '',
          logoImage: '',
          order: 5,
          casosExito: [
            { empresa: 'Cenicafé, Colombia', descripcion: 'Desarrolló e implementó sistemas modulares de tratamiento anaerobio para aguas mieles del café, con remociones superiores al 80% de la carga orgánica. Referente sólido que demuestra que este efluente requiere una solución específica y que su tratamiento biológico ya ha sido validado técnicamente dentro del propio sector cafetalero.' },
            { empresa: 'Alfanzyme, India (ENVI COFF)', descripcion: 'Comercializa una biocultura formulada específicamente para la industria del café. Referente comercial relevante que confirma que ya existe mercado para soluciones microbiológicas especializadas en aguas mieles.' }
          ],
          tamSamSom: {
            tam: { valor: '16,145', descripcion: 'Beneficios húmedos en Guatemala. Se tomó esta base porque mantiene una sola unidad de análisis: operaciones que sí generan aguas mieles.' },
            sam: { valor: '15,713', descripcion: 'Beneficios húmedos artesanales, tradicionales y semi-tecnificados, equivalentes al 97.3% del TAM.' },
            som: { valor: '619', descripcion: 'Beneficios húmedos semi-tecnificados, equivalentes al 3.94% del SAM y 3.83% del TAM.' },
            precio: 'Q756.87 por compra (referencia: Dry Microbes 10B – 32 oz, Bacteria Direct, EE. UU.)',
            frecuencia: '2 compras al año',
            mercado: 'Q937,006 anuales (619 beneficios x 2 compras x Q756.87)',
            fuentes: 'Cenicafé, Colombia; Alfanzyme, India; Bacteria Direct, EE. UU.'
          }
        },
        {
          id: 'liptra',
          category: 'agroflow',
          fase: 'I',
          name: 'LIPTRA',
          subtitle: 'Tratamiento Biológico para Efluentes Cárnicos',
          description: 'Bioformulación de microorganismos y enzimas especializada en el tratamiento de efluentes de rastros y plantas de procesamiento cárnico con alta carga de grasas, sangre y materia orgánica.',
          format: 'Bioformulación líquida/polvo',
          benefits: ['Especializado en efluentes cárnicos', 'Degrada grasas, sangre y materia orgánica', 'Acelera biodegradación en trampas de grasa y drenajes'],
          productImage: '',
          logoImage: '',
          order: 6,
          casosExito: [
            { empresa: 'Alfanzyme, India (ENVI MSF)', descripcion: 'Comercializa una biocultura formulada para la industria de meat and seafood. Referente directo que demuestra que ya existe especialización microbiológica comercial para efluentes cárnicos y no solo soluciones genéricas para aguas residuales.' },
            { empresa: 'BioAlkim, México (BioAlkim TGD)', descripcion: 'Ofrece una bioformulación de microorganismos y enzimas para acelerar la biodegradación en trampas de grasa, drenajes y sistemas de aguas residuales. Referente relevante que valida la lógica de intervenir grasas, aceites y materia orgánica desde puntos críticos del sistema.' }
          ],
          tamSamSom: {
            tam: { valor: '265', descripcion: 'Rastros en Guatemala. Representa el universo amplio de establecimientos de sacrificio identificados en el país.' },
            sam: { valor: '207', descripcion: 'Rastros en funcionamiento, equivalentes al 78.1% del TAM. Operaciones realmente activas que podrían requerir una solución para efluentes con grasas, sangre y alta carga orgánica.' },
            som: { valor: '20', descripcion: 'Rastros privados, equivalentes al 9.66% del SAM y 7.55% del TAM. Segmento con mayor probabilidad de compra, implementación y continuidad de uso.' },
            precio: 'Q1,836.88 por compra (referencia: PlantPRO FOG Zapper, USA BlueBook, EE. UU.)',
            frecuencia: '2 compras al año',
            mercado: 'Q73,475 anuales (20 rastros x 2 compras x Q1,836.88)',
            fuentes: 'Alfanzyme, India; BioAlkim, México; USA BlueBook, EE. UU.'
          }
        },
        {
          id: 'verdexa',
          category: 'agroflow',
          fase: 'I',
          name: 'VERDEXA',
          subtitle: 'Tratamiento de Agua Postcosecha para Frutas y Hortalizas',
          description: 'Solución biológica para el tratamiento y reciclaje de agua en operaciones de empaque postcosecha de frutas y hortalizas. Enfocada en reducir residuos orgánicos antes de que lleguen a ríos y corrientes.',
          format: 'Líquido concentrado',
          benefits: ['Reciclaje y recirculación de agua de packing', 'Evita que residuos orgánicos lleguen a ríos', 'Ideal para operaciones exportadoras'],
          productImage: '',
          logoImage: '',
          order: 7,
          casosExito: [
            { empresa: 'Dole, operaciones globales', descripcion: 'Ha reportado sistemas de reciclaje y recirculación de agua en sus packing facilities de banano y piña. Referente fuerte que demuestra inversión real en gestión y reúso de agua dentro del proceso postcosecha.' },
            { empresa: 'Chiquita, operaciones globales bananeras', descripcion: 'Reporta el uso de wastewater filters en sus packing stations para evitar que residuos orgánicos lleguen a ríos y corrientes. Confirma que el agua de packing sí representa un problema operativo y ambiental real para empresas líderes del sector.' }
          ],
          tamSamSom: {
            tam: { valor: '676', descripcion: 'Operaciones autorizadas de frutas y hortalizas en Guatemala.' },
            sam: { valor: '325', descripcion: 'Operaciones autorizadas, equivalentes al 48.1% del TAM. Seleccionadas únicamente las que combinan transformación, empaque o almacenamiento con finalidad de exportación.' },
            som: { valor: '53', descripcion: 'Operaciones ubicadas en Sacatepéquez y Chimaltenango, equivalentes al 16.3% del SAM y 7.8% del TAM. Clúster de operaciones exportadoras manejables para una entrada comercial inicial.' },
            precio: 'Q1,409.50 por compra (referencia: GP-110 Liquid – 5 gal, Bacteria Direct, EE. UU.)',
            frecuencia: '2 compras al año',
            mercado: 'Q149,407 anuales (53 operaciones x 2 compras x Q1,409.50)',
            fuentes: 'Dole; Chiquita; MAGA, Guatemala; Bacteria Direct, EE. UU.'
          }
        },
        {
          id: 'palvera',
          category: 'agroflow',
          fase: 'I',
          name: 'PALVERA',
          subtitle: 'Bioaugmentación para Plantas Extractoras de Palma',
          description: 'Solución de bioaugmentación diseñada para mejorar el tratamiento de POME (Palm Oil Mill Effluent) en lagunas y biodigestores de plantas extractoras de palma.',
          format: 'Concentrado biológico',
          benefits: ['Reducción de COD y lodos en plantas de palma', 'Se integra en sistemas de tratamiento existentes', 'Aplicación biológica en operaciones del sector palmero'],
          productImage: '',
          logoImage: '',
          order: 8,
          casosExito: [
            { empresa: 'Fedepalma / Cenipalma, Colombia', descripcion: 'Documentan el tratamiento del POME mediante lagunas y biodigestores. Referente clave que valida exactamente el punto donde Palvera entra: dentro del sistema de tratamiento existente, no sobre POME crudo.' },
            { empresa: 'BiOWiSH + Minamas Group, Indonesia', descripcion: 'Reportan un caso de bioaugmentación aplicada a POME con reducción de COD y lodos en una planta del sector palma. El referente más cercano a Palvera porque sí muestra aplicación biológica en una operación real del sector palmero.' }
          ],
          tamSamSom: {
            tam: { valor: '20', descripcion: 'Plantas extractoras de palma en Guatemala.' },
            sam: { valor: '10', descripcion: 'Plantas extractoras de la región norte, equivalentes al 50% del TAM. El norte representa el clúster geográfico más fuerte para una entrada inicial.' },
            som: { valor: '2', descripcion: 'Plantas extractoras del norte, equivalentes al 20% del SAM y 10% del TAM. Definido como mercado inicial de piloto y validación comercial.' },
            precio: 'Q4,286.05 por compra (referencia: VitaStim Sludge Reducer, Aquafix, EE. UU.)',
            frecuencia: '2 compras al año',
            mercado: 'Q17,144 anuales (2 plantas x 2 compras x Q4,286.05)',
            fuentes: 'Fedepalma, Colombia; Cenipalma, Colombia; BiOWiSH / Minamas Group, Indonesia; GREPALMA, Guatemala; Aquafix, EE. UU.'
          }
        },
        {
          id: 'biopharma',
          category: 'hospitalwatershield',
          fase: 'I',
          name: 'BIOPHARMA',
          subtitle: 'Tratamiento de Aguas Residuales Hospitalarias',
          description: 'Consorcio microbiano en formato líquido diseñado para la bioaugmentación de plantas de tratamiento de aguas residuales hospitalarias. Mejora el desempeño biológico de los sistemas existentes.',
          format: 'Líquido concentrado',
          benefits: ['Degrada antibióticos y compuestos farmacéuticos', 'Mejora eficiencia del tratamiento existente', 'No requiere modificar infraestructura instalada'],
          productImage: '/images/biopharma-product.jpg',
          logoImage: '',
          order: 5
        },
        {
          id: 'biopowder',
          category: 'hospitalwatershield',
          fase: 'I',
          name: 'BIOPOWDER',
          subtitle: 'Bioaugmentación en Polvo Liofilizado',
          description: 'Consorcio microbiano en formato de polvo liofilizado, diseñado para procesos de bioaugmentación en plantas de tratamiento de aguas residuales. Mayor estabilidad y fácil almacenamiento.',
          format: 'Polvo liofilizado',
          benefits: ['Se activa al contacto con el agua', 'Fácil transporte y almacenamiento', 'Mantiene continuidad operativa del tratamiento biológico'],
          productImage: '/images/biopowder-product.jpg',
          logoImage: '',
          order: 6
        },
        {
          id: 'bioshield',
          category: 'hospitalwatershield',
          fase: 'I',
          name: 'BIOSHIELD',
          subtitle: 'Degradación de Compuestos Farmacéuticos',
          description: 'Consorcio microbiano líquido especializado en la degradación de antibióticos y compuestos farmacéuticos complejos presentes en aguas residuales hospitalarias.',
          format: 'Líquido concentrado 1L',
          benefits: ['Degrada compuestos farmacéuticos persistentes', 'Reduce bacterias resistentes en el agua', 'Mejora calidad del efluente antes de descarga'],
          productImage: '/images/bioshield-product.jpg',
          logoImage: '',
          order: 7
        },
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
      ],
      categories: [
        { id: 'greendrain', name: 'Green Drain', description: 'Soluciones para el hogar y tuberías', icon: 'fa-house-chimney', order: 1, fase: 'I' },
        { id: 'agroflow', name: 'Agroflow', description: 'Soluciones para agricultura y drenaje', icon: 'fa-seedling', order: 2, fase: 'I' },
        { id: 'waterbridge', name: 'Waterbridge', description: 'Soluciones para puentes hídricos', icon: 'fa-bridge-water', order: 3, fase: 'I' },
        { id: 'hospitalwatershield', name: 'Hospital WaterShield', description: 'Tratamiento de aguas residuales hospitalarias', icon: 'fa-hospital', order: 4, fase: 'I' },
        { id: 'hospitalarias', name: 'Plantas de Tratamiento Hospitalarias', description: 'Soluciones microbiológicas para PTAR de hospitales y centros de salud.', icon: 'fa-hospital-user', order: 1, fase: 'II' },
        { id: 'industriales', name: 'Plantas de Tratamiento Industriales', description: 'Soluciones para condominios, parques industriales mixtos e industria textil.', icon: 'fa-industry', order: 2, fase: 'II' },
        { id: 'municipales', name: 'Plantas de Tratamiento Municipales', description: 'Control biológico de olores en PTAR municipales, lagunas y drenajes.', icon: 'fa-city', order: 3, fase: 'II' }
      ]
    };
    fs.writeFileSync(DB_PATH, JSON.stringify(initial, null, 2));
    return initial;
  }
  return JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
}

function saveDB(data) {
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
}

// Middleware
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(session({
  secret: process.env.SESSION_SECRET || 'ecoproduct-dev-only-set-SESSION_SECRET-in-env',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 24 * 60 * 60 * 1000 }
}));

// Flash messages middleware
app.use((req, res, next) => {
  res.locals.flash = req.session.flash || {};
  delete req.session.flash;
  res.locals.user = req.session.user || null;
  next();
});

function flash(req, type, message) {
  req.session.flash = { type, message };
}

// File upload config
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, 'public', 'uploads')),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, Date.now() + '-' + Math.round(Math.random() * 1E6) + ext);
  }
});
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 }, fileFilter: (req, file, cb) => {
  const allowed = /jpeg|jpg|png|gif|webp/;
  const ok = allowed.test(path.extname(file.originalname).toLowerCase()) && allowed.test(file.mimetype.split('/')[1] || '');
  cb(ok ? null : new Error('Solo se permiten imágenes'), ok);
}});

// Auth middleware
function requireAuth(req, res, next) {
  if (req.session.user) return next();
  res.redirect('/admin/login');
}
function requireAdmin(req, res, next) {
  if (req.session.user && req.session.user.role === 'admin') return next();
  flash(req, 'error', 'Acceso denegado');
  res.redirect('/admin');
}

// ==================== PUBLIC ROUTES ====================

app.get('/', (req, res) => {
  const db = loadDB();
  res.render('index', { content: db.siteContent, products: db.products, categories: db.categories });
});

// Landing dedicada BacVita (Fase II - producto principal hospitalario)
// Layout standalone (no usa partials/header ni partials/footer): fidelidad visual con la referencia.
app.get('/bacvita', (req, res) => {
  res.render('bacvita');
});

app.get('/categoria/:id', (req, res) => {
  const db = loadDB();
  const cat = db.categories.find(c => c.id === req.params.id);
  if (!cat) return res.redirect('/');
  const prods = db.products.filter(p => p.category === req.params.id).sort((a, b) => a.order - b.order);
  res.render('category', { content: db.siteContent, category: cat, products: prods, categories: db.categories });
});

app.get('/producto/:id', (req, res) => {
  const db = loadDB();
  const product = db.products.find(p => p.id === req.params.id);
  if (!product) return res.redirect('/');
  res.render('product', { content: db.siteContent, product, categories: db.categories });
});

// ==================== ADMIN AUTH ====================

app.get('/admin/login', (req, res) => {
  if (req.session.user) return res.redirect('/admin');
  res.render('admin/login', { flash: res.locals.flash });
});

app.post('/admin/login', (req, res) => {
  const db = loadDB();
  const { username, password } = req.body;
  const user = db.users.find(u => u.username === username);
  if (!user || !bcrypt.compareSync(password, user.password)) {
    flash(req, 'error', 'Credenciales incorrectas');
    return res.redirect('/admin/login');
  }
  req.session.user = { id: user.id, username: user.username, role: user.role };
  res.redirect('/admin');
});

app.get('/admin/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/admin/login');
});

// ==================== ADMIN DASHBOARD ====================

app.get('/admin', requireAuth, (req, res) => {
  const db = loadDB();
  res.render('admin/dashboard', { db, user: req.session.user, flash: res.locals.flash });
});

// --- Site Content ---
app.get('/admin/content', requireAuth, (req, res) => {
  const db = loadDB();
  res.render('admin/content', { content: db.siteContent, user: req.session.user, flash: res.locals.flash });
});

app.post('/admin/content', requireAuth, (req, res) => {
  const db = loadDB();
  const fields = [
    'heroTitle', 'heroSubtitle', 'heroDescription', 'heroTagline',
    'aboutTitle', 'aboutText', 'footerText', 'whatsappNumber', 'contactEmail',
    'faseIITitle', 'faseIIIntro', 'faseITitle', 'faseISubtitle',
    'conceptosTitle', 'conceptosIntro'
  ];
  fields.forEach(f => { if (req.body[f] !== undefined) db.siteContent[f] = req.body[f]; });

  // Conceptos de negocio (5 bloques: mercado, oferta, distribucion, produccion, modelo)
  if (!db.siteContent.conceptos) db.siteContent.conceptos = {};
  ['mercado', 'oferta', 'distribucion', 'produccion', 'modelo'].forEach(key => {
    const titulo = req.body[`concepto_${key}_titulo`];
    const icon = req.body[`concepto_${key}_icon`];
    const texto = req.body[`concepto_${key}_texto`];
    if (titulo !== undefined || icon !== undefined || texto !== undefined) {
      db.siteContent.conceptos[key] = db.siteContent.conceptos[key] || {};
      if (titulo !== undefined) db.siteContent.conceptos[key].titulo = titulo;
      if (icon !== undefined) db.siteContent.conceptos[key].icon = icon;
      if (texto !== undefined) db.siteContent.conceptos[key].texto = texto;
    }
  });

  saveDB(db);
  flash(req, 'success', 'Contenido actualizado correctamente');
  res.redirect('/admin/content');
});

// --- Products ---
app.get('/admin/products', requireAuth, (req, res) => {
  const db = loadDB();
  res.render('admin/products', { products: db.products, categories: db.categories, user: req.session.user, flash: res.locals.flash });
});

app.get('/admin/products/edit/:id', requireAuth, (req, res) => {
  const db = loadDB();
  const product = db.products.find(p => p.id === req.params.id);
  if (!product) return res.redirect('/admin/products');
  res.render('admin/product-edit', { product, categories: db.categories, user: req.session.user, flash: res.locals.flash });
});

app.post('/admin/products/edit/:id', requireAuth, upload.fields([
  { name: 'productImage', maxCount: 1 },
  { name: 'logoImage', maxCount: 1 }
]), (req, res) => {
  const db = loadDB();
  const idx = db.products.findIndex(p => p.id === req.params.id);
  if (idx === -1) return res.redirect('/admin/products');

  db.products[idx].name = req.body.name || db.products[idx].name;
  db.products[idx].subtitle = req.body.subtitle || db.products[idx].subtitle;
  db.products[idx].description = req.body.description || db.products[idx].description;
  db.products[idx].format = req.body.format || db.products[idx].format;
  db.products[idx].category = req.body.category || db.products[idx].category;
  db.products[idx].order = parseInt(req.body.order) || db.products[idx].order;
  if (req.body.fase === 'I' || req.body.fase === 'II') db.products[idx].fase = req.body.fase;

  // Bloques largos opcionales (Fase II). Se aceptan cadenas vacías para limpiarlos.
  ['justificacion', 'alcancePreliminar', 'loQueBusca', 'loQueValida', 'loQueNoPromete'].forEach(k => {
    if (req.body[k] !== undefined) db.products[idx][k] = req.body[k];
  });

  if (req.body.benefits) {
    db.products[idx].benefits = req.body.benefits.split('\n').map(b => b.trim()).filter(b => b);
  }
  if (req.files && req.files.productImage) {
    db.products[idx].productImage = '/uploads/' + req.files.productImage[0].filename;
  }
  if (req.files && req.files.logoImage) {
    db.products[idx].logoImage = '/uploads/' + req.files.logoImage[0].filename;
  }

  saveDB(db);
  flash(req, 'success', 'Producto actualizado');
  res.redirect('/admin/products');
});

app.get('/admin/products/new', requireAuth, (req, res) => {
  res.render('admin/product-edit', {
    product: { id: '', name: '', subtitle: '', description: '', format: '', benefits: [], productImage: '', logoImage: '', category: 'greendrain', order: 99, fase: 'I', justificacion: '', alcancePreliminar: '', loQueBusca: '', loQueValida: '', loQueNoPromete: '' },
    categories: loadDB().categories,
    user: req.session.user, flash: res.locals.flash
  });
});

app.post('/admin/products/new', requireAuth, upload.fields([
  { name: 'productImage', maxCount: 1 },
  { name: 'logoImage', maxCount: 1 }
]), (req, res) => {
  const db = loadDB();
  const newProduct = {
    id: req.body.name.toLowerCase().replace(/[^a-z0-9]/g, ''),
    name: req.body.name,
    subtitle: req.body.subtitle || '',
    description: req.body.description || '',
    format: req.body.format || '',
    category: req.body.category || 'greendrain',
    fase: (req.body.fase === 'II' ? 'II' : 'I'),
    order: parseInt(req.body.order) || 99,
    benefits: req.body.benefits ? req.body.benefits.split('\n').map(b => b.trim()).filter(b => b) : [],
    productImage: req.files && req.files.productImage ? '/uploads/' + req.files.productImage[0].filename : '',
    logoImage: req.files && req.files.logoImage ? '/uploads/' + req.files.logoImage[0].filename : '',
    justificacion: req.body.justificacion || '',
    alcancePreliminar: req.body.alcancePreliminar || '',
    loQueBusca: req.body.loQueBusca || '',
    loQueValida: req.body.loQueValida || '',
    loQueNoPromete: req.body.loQueNoPromete || ''
  };
  db.products.push(newProduct);
  saveDB(db);
  flash(req, 'success', 'Producto creado');
  res.redirect('/admin/products');
});

app.post('/admin/products/delete/:id', requireAuth, requireAdmin, (req, res) => {
  const db = loadDB();
  db.products = db.products.filter(p => p.id !== req.params.id);
  saveDB(db);
  flash(req, 'success', 'Producto eliminado');
  res.redirect('/admin/products');
});

// --- Categories ---
app.get('/admin/categories', requireAuth, (req, res) => {
  const db = loadDB();
  res.render('admin/categories', { categories: db.categories, user: req.session.user, flash: res.locals.flash });
});

app.post('/admin/categories/edit/:id', requireAuth, (req, res) => {
  const db = loadDB();
  const cat = db.categories.find(c => c.id === req.params.id);
  if (cat) {
    cat.name = req.body.name || cat.name;
    cat.description = req.body.description || cat.description;
    cat.icon = req.body.icon || cat.icon;
    cat.order = parseInt(req.body.order) || cat.order;
    if (req.body.fase === 'I' || req.body.fase === 'II') cat.fase = req.body.fase;
    saveDB(db);
  }
  flash(req, 'success', 'Categoría actualizada');
  res.redirect('/admin/categories');
});

app.post('/admin/categories/new', requireAuth, requireAdmin, (req, res) => {
  const db = loadDB();
  const { name, description, icon, order, fase } = req.body;
  if (!name) { flash(req, 'error', 'El nombre es obligatorio'); return res.redirect('/admin/categories'); }
  const id = name.toLowerCase().replace(/[^a-z0-9]/g, '');
  if (!id) { flash(req, 'error', 'Nombre inválido'); return res.redirect('/admin/categories'); }
  if (db.categories.find(c => c.id === id)) { flash(req, 'error', 'Ya existe una categoría con ese nombre'); return res.redirect('/admin/categories'); }
  db.categories.push({
    id,
    name,
    description: description || '',
    icon: icon || 'fa-leaf',
    order: parseInt(order) || (db.categories.length + 1),
    fase: (fase === 'II' ? 'II' : 'I')
  });
  saveDB(db);
  flash(req, 'success', 'Categoría creada');
  res.redirect('/admin/categories');
});

app.post('/admin/categories/delete/:id', requireAuth, requireAdmin, (req, res) => {
  const db = loadDB();
  const used = db.products.some(p => p.category === req.params.id);
  if (used) {
    flash(req, 'error', 'No se puede eliminar: hay productos asignados a esta categoría');
    return res.redirect('/admin/categories');
  }
  db.categories = db.categories.filter(c => c.id !== req.params.id);
  saveDB(db);
  flash(req, 'success', 'Categoría eliminada');
  res.redirect('/admin/categories');
});

// --- Hero Image ---
app.post('/admin/hero-image', requireAuth, upload.single('heroImage'), (req, res) => {
  if (req.file) {
    const db = loadDB();
    db.siteContent.heroImage = '/uploads/' + req.file.filename;
    saveDB(db);
    flash(req, 'success', 'Imagen de portada actualizada');
  }
  res.redirect('/admin/content');
});

// --- Users ---
app.get('/admin/users', requireAuth, requireAdmin, (req, res) => {
  const db = loadDB();
  res.render('admin/users', { users: db.users, user: req.session.user, flash: res.locals.flash });
});

app.post('/admin/users/new', requireAuth, requireAdmin, (req, res) => {
  const db = loadDB();
  const { username, password, role } = req.body;
  if (!username || !password) { flash(req, 'error', 'Todos los campos son obligatorios'); return res.redirect('/admin/users'); }
  if (db.users.find(u => u.username === username)) { flash(req, 'error', 'El usuario ya existe'); return res.redirect('/admin/users'); }
  const maxId = db.users.reduce((m, u) => Math.max(m, u.id), 0);
  db.users.push({ id: maxId + 1, username, password: bcrypt.hashSync(password, 10), role: role || 'editor', createdAt: new Date().toISOString() });
  saveDB(db);
  flash(req, 'success', 'Usuario creado');
  res.redirect('/admin/users');
});

app.post('/admin/users/delete/:id', requireAuth, requireAdmin, (req, res) => {
  const db = loadDB();
  const userId = parseInt(req.params.id);
  if (userId === req.session.user.id) { flash(req, 'error', 'No puedes eliminarte a ti mismo'); return res.redirect('/admin/users'); }
  db.users = db.users.filter(u => u.id !== userId);
  saveDB(db);
  flash(req, 'success', 'Usuario eliminado');
  res.redirect('/admin/users');
});

app.post('/admin/users/change-password/:id', requireAuth, requireAdmin, (req, res) => {
  const db = loadDB();
  const user = db.users.find(u => u.id === parseInt(req.params.id));
  if (user && req.body.password) {
    user.password = bcrypt.hashSync(req.body.password, 10);
    saveDB(db);
    flash(req, 'success', 'Contraseña actualizada');
  }
  res.redirect('/admin/users');
});

// ==================== START ====================
app.listen(PORT, () => {
  console.log(`EcoProduct corriendo en http://localhost:${PORT}`);
  console.log(`Panel de admin: http://localhost:${PORT}/admin`);
  if (!process.env.SESSION_SECRET) {
    console.warn('⚠️  SESSION_SECRET no definido en el entorno. Usando valor por defecto (NO apto para producción). Definir SESSION_SECRET en .env.');
  }
  // El default admin/admin123 solo aplica cuando se crea data/db.json por primera vez.
  // En entornos ya inicializados, cambiar la contraseña desde /admin/users.
  if (!process.env.ADMIN_INITIAL_PASSWORD && !fs.existsSync(DB_PATH)) {
    console.log(`Credenciales iniciales → usuario: ${INITIAL_ADMIN_USER} / contraseña: ${INITIAL_ADMIN_PASS}  (cambiar al primer login)`);
  }
});
