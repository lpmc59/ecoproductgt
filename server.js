const express = require('express');
const session = require('express-session');
const bcrypt = require('bcryptjs');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 6001;

// --- JSON-based DB ---
const DB_PATH = path.join(__dirname, 'data', 'db.json');

function loadDB() {
  if (!fs.existsSync(DB_PATH)) {
    const initial = {
      users: [
        { id: 1, username: 'admin', password: bcrypt.hashSync('admin123', 10), role: 'admin', createdAt: new Date().toISOString() }
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
        contactEmail: 'info@ecoproduct.com'
      },
      products: [
        {
          id: 'greendrain',
          category: 'greendrain',
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
          name: 'BIOSHIELD',
          subtitle: 'Degradación de Compuestos Farmacéuticos',
          description: 'Consorcio microbiano líquido especializado en la degradación de antibióticos y compuestos farmacéuticos complejos presentes en aguas residuales hospitalarias.',
          format: 'Líquido concentrado 1L',
          benefits: ['Degrada compuestos farmacéuticos persistentes', 'Reduce bacterias resistentes en el agua', 'Mejora calidad del efluente antes de descarga'],
          productImage: '/images/bioshield-product.jpg',
          logoImage: '',
          order: 7
        }
      ],
      categories: [
        { id: 'greendrain', name: 'Green Drain', description: 'Soluciones para el hogar y tuberías', icon: 'fa-house-chimney', order: 1 },
        { id: 'agroflow', name: 'Agroflow', description: 'Soluciones para agricultura y drenaje', icon: 'fa-seedling', order: 2 },
        { id: 'waterbridge', name: 'Waterbridge', description: 'Soluciones para puentes hídricos', icon: 'fa-bridge-water', order: 3 },
        { id: 'hospitalwatershield', name: 'Hospital WaterShield', description: 'Tratamiento de aguas residuales hospitalarias', icon: 'fa-hospital', order: 4 }
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
  secret: 'ecoproduct-secret-key-2026',
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
  const fields = ['heroTitle', 'heroSubtitle', 'heroDescription', 'heroTagline', 'aboutTitle', 'aboutText', 'footerText', 'whatsappNumber', 'contactEmail'];
  fields.forEach(f => { if (req.body[f] !== undefined) db.siteContent[f] = req.body[f]; });
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
    product: { id: '', name: '', subtitle: '', description: '', format: '', benefits: [], productImage: '', logoImage: '', category: 'greendrain', order: 99 },
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
    order: parseInt(req.body.order) || 99,
    benefits: req.body.benefits ? req.body.benefits.split('\n').map(b => b.trim()).filter(b => b) : [],
    productImage: req.files && req.files.productImage ? '/uploads/' + req.files.productImage[0].filename : '',
    logoImage: req.files && req.files.logoImage ? '/uploads/' + req.files.logoImage[0].filename : ''
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
    saveDB(db);
  }
  flash(req, 'success', 'Categoría actualizada');
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
  console.log(`Usuario: admin | Contraseña: admin123`);
});
