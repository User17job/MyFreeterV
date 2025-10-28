# 🚀 Freeter Cloud - Tu Espacio de Trabajo Personal

![Freeter Cloud](https://img.shields.io/badge/React-18.3-blue) ![Vite](https://img.shields.io/badge/Vite-5.1-purple) ![Supabase](https://img.shields.io/badge/Supabase-Ready-green)

**Freeter Cloud** es tu centro de control digital personal inspirado en Freeter, pero en la nube con sincronización entre dispositivos. Gestiona tareas, calendario, notas, timer pomodoro y enlaces rápidos desde cualquier lugar.

---

## ✨ Características

- 🔐 **Autenticación segura** con Supabase Auth
- 📋 **Widgets modulares**: Tareas, Calendario, Notas, Timer, Enlaces
- 🎨 **Drag & Drop** para reordenar y redimensionar widgets
- 🌙 **Tema oscuro** basado en tu branding RJSS
- 📱 **Responsive** - funciona en desktop y móvil
- ☁️ **Sincronización en tiempo real** entre dispositivos
- 🎯 **Timer Pomodoro** con alertas visuales y sonoras
- 📅 **Calendario integrado** con vista mensual
- 🔗 **Enlaces rápidos** organizados
- ✅ **Lista de tareas** con estados y prioridades

---

## 📋 Pre-requisitos

Antes de comenzar, asegúrate de tener instalado:

- **Node.js** >= 18.x ([Descargar](https://nodejs.org/))
- **npm** o **yarn**
- Una cuenta en **Supabase** ([Crear cuenta gratis](https://supabase.com))

---

## 🛠️ Instalación

### 1. Clonar o crear el proyecto

```bash
# Opción A: Si tienes el repositorio
git clone https://github.com/tu-usuario/freeter-cloud.git
cd freeter-cloud

# Opción B: Crear desde cero
npm create vite@latest freeter-cloud -- --template react
cd freeter-cloud
```

### 2. Instalar dependencias

```bash
npm install
```

### 3. Configurar Supabase

#### 3.1 Crear proyecto en Supabase

1. Ve a [Supabase](https://supabase.com)
2. Crea un nuevo proyecto
3. Guarda las credenciales que te proporciona

#### 3.2 Configurar la base de datos

En el panel de Supabase, ve a **SQL Editor** y ejecuta este script:

```sql
-- Tabla de widgets
CREATE TABLE widgets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL,
  title VARCHAR(255),
  position JSONB DEFAULT '{"x": 0, "y": 0, "w": 2, "h": 2}',
  data JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de tareas
CREATE TABLE todos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  widget_id UUID REFERENCES widgets(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  completed BOOLEAN DEFAULT FALSE,
  priority VARCHAR(20) DEFAULT 'medium',
  due_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de eventos de calendario
CREATE TABLE calendar_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  widget_id UUID REFERENCES widgets(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE NOT NULL,
  color VARCHAR(7) DEFAULT '#c67236',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de notas
CREATE TABLE notes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  widget_id UUID REFERENCES widgets(id) ON DELETE CASCADE,
  content TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de enlaces rápidos
CREATE TABLE quick_links (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  widget_id UUID REFERENCES widgets(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  url TEXT NOT NULL,
  icon VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar Row Level Security
ALTER TABLE widgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE todos ENABLE ROW LEVEL SECURITY;
ALTER TABLE calendar_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE quick_links ENABLE ROW LEVEL SECURITY;

-- Políticas para widgets
CREATE POLICY "Users can view their own widgets" ON widgets FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own widgets" ON widgets FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own widgets" ON widgets FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own widgets" ON widgets FOR DELETE USING (auth.uid() = user_id);

-- Políticas para todos
CREATE POLICY "Users can view their own todos" ON todos FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own todos" ON todos FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own todos" ON todos FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own todos" ON todos FOR DELETE USING (auth.uid() = user_id);

-- Políticas para calendar_events
CREATE POLICY "Users can view their own events" ON calendar_events FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own events" ON calendar_events FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own events" ON calendar_events FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own events" ON calendar_events FOR DELETE USING (auth.uid() = user_id);

-- Políticas para notes
CREATE POLICY "Users can view their own notes" ON notes FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own notes" ON notes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own notes" ON notes FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own notes" ON notes FOR DELETE USING (auth.uid() = user_id);

-- Políticas para quick_links
CREATE POLICY "Users can view their own links" ON quick_links FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own links" ON quick_links FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own links" ON quick_links FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own links" ON quick_links FOR DELETE USING (auth.uid() = user_id);
```

### 4. Configurar variables de entorno

Crea un archivo `.env` en la raíz del proyecto:

```bash
cp .env.example .env
```

Edita `.env` y agrega tus credenciales de Supabase:

```env
VITE_SUPABASE_URL=https://tuproyecto.supabase.co
VITE_SUPABASE_ANON_KEY=tu_anon_key_aqui
```

### 5. Agregar tu logo

Coloca tu logo (el archivo del birrete RJSS) en:

```
public/logo.png
```

---

## 🚀 Ejecutar el proyecto

```bash
# Modo desarrollo
npm run dev

# El proyecto se abrirá en http://localhost:3000
```

---

## 📦 Build para producción

```bash
# Crear build optimizado
npm run build

# Vista previa del build
npm run preview
```

---

## 🎯 Uso

### Primer inicio

1. **Registro**: Crea tu cuenta con email y contraseña
2. **Dashboard**: Serás redirigido a tu dashboard vacío
3. **Agregar widgets**: Usa el menú lateral para agregar widgets
4. **Personalizar**: Arrastra y redimensiona los widgets según tu preferencia

### Widgets disponibles

| Widget            | Descripción         | Funcionalidades                                        |
| ----------------- | ------------------- | ------------------------------------------------------ |
| 📋 **Tareas**     | Lista de pendientes | ✓ Agregar/eliminar/completar<br>✓ Contador de progreso |
| 📅 **Calendario** | Vista mensual       | ✓ Agregar eventos<br>✓ Navegación mes a mes            |
| 📝 **Notas**      | Bloc de notas       | ✓ Autoguardado<br>✓ Formato simple                     |
| ⏱️ **Timer**      | Pomodoro            | ✓ 25/5/15 min<br>✓ Alertas sonoras                     |
| 🔗 **Enlaces**    | Links rápidos       | ✓ Grid de accesos<br>✓ Abrir en nueva pestaña          |

---

## 🎨 Personalización

### Colores del tema

Los colores están basados en tu branding RJSS:

```css
--navy-blue: #2c3e50; /* Azul del birrete */
--orange-brown: #c67236; /* Naranja accent */
--dark-primary: #1a1a1a; /* Fondo principal */
```

Puedes modificarlos en:

- `tailwind.config.js` → colores de Tailwind
- `src/styles/globals.css` → variables CSS

### Agregar más widgets

1. Crea el componente en `src/components/widgets/TuWidget.jsx`
2. Agrégalo a `WIDGET_COMPONENTS` en `WidgetGrid.jsx`
3. Agrégalo a `WIDGET_TYPES` en `Sidebar.jsx`
4. Agrégalo a `WIDGET_TITLES` en `Dashboard.jsx`

---

## 📱 Deploy

### Vercel (Recomendado)

```bash
# Instalar Vercel CLI
npm i -g vercel

# Deploy
vercel

# Configurar variables de entorno en el dashboard de Vercel
```

### Netlify

```bash
# Build command
npm run build

# Publish directory
dist
```

---

## 🔧 Troubleshooting

### Error: "Cannot find module '@/...'"

Asegúrate de tener `jsconfig.json` en la raíz del proyecto.

### Error de autenticación con Supabase

1. Verifica que las credenciales en `.env` sean correctas
2. Confirma que las políticas RLS estén habilitadas
3. Revisa la consola de Supabase para ver logs de errores

### Widgets no se guardan

1. Verifica la conexión a Supabase
2. Revisa las políticas RLS en las tablas
3. Abre DevTools → Console para ver errores

---

## 📚 Stack Tecnológico

- **Frontend**: React 18 + Vite
- **Styling**: Tailwind CSS
- **State Management**: Zustand
- **Backend**: Supabase (PostgreSQL + Auth + Realtime)
- **Routing**: React Router v6
- **Grid System**: React Grid Layout
- **Icons**: Lucide React
- **Date handling**: date-fns

---

## 🤝 Contribuir

Este es tu proyecto personal, pero si quieres expandirlo:

1. Fork el repositorio
2. Crea una rama: `git checkout -b feature/nueva-funcionalidad`
3. Commit: `git commit -m 'Agregar nueva funcionalidad'`
4. Push: `git push origin feature/nueva-funcionalidad`
5. Abre un Pull Request

---

## 📄 Licencia

Proyecto personal - RJSS © 2025

---

## 🎯 Roadmap

- [ ] PWA (Progressive Web App)
- [ ] App móvil con React Native
- [ ] Desktop app con Electron/Tauri
- [ ] Modo offline con sincronización
- [ ] Colaboración en widgets compartidos
- [ ] Integraciones (Trello, Notion, Google Calendar)
- [ ] Widgets personalizables con código
- [ ] Themes / Skins
- [ ] Exportar/Importar configuración

---

## 📞 Soporte

Si tienes problemas o dudas:

1. Revisa la sección de Troubleshooting
2. Consulta la documentación de [Supabase](https://supabase.com/docs)
3. Revisa issues similares en el repositorio

---

**¡Disfruta tu Freeter Cloud! 🚀**
