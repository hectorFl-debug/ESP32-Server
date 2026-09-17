const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Estado compartido en memoria. Se reinicia si el servidor se reinicia
// (en el plan gratis de Render eso pasa tras 15 min sin tráfico).
let estado = {
  modo: 'automatico',    // 'automatico' | 'manual'
  rele: 'off',            // 'on' | 'off' -> lo que se pide en modo manual
  releReal: 'off',        // último estado que el ESP32 confirmó haber aplicado
  luz: null,               // última lectura del sensor reportada por el ESP32
  ultimaConexion: null     // timestamp ISO del último contacto del ESP32
};

// El ESP32 llama esto cada pocos segundos para saber qué debe hacer
app.get('/api/estado', (req, res) => {
  res.json(estado);
});

// La página web usa esto para cambiar entre automático y manual
app.post('/api/modo', (req, res) => {
  const { modo } = req.body;
  if (modo !== 'automatico' && modo !== 'manual') {
    return res.status(400).json({ error: 'modo inválido, usa "automatico" o "manual"' });
  }
  estado.modo = modo;
  res.json(estado);
});

// La página web usa esto para encender/apagar cuando el modo es manual
app.post('/api/rele', (req, res) => {
  const { rele } = req.body;
  if (rele !== 'on' && rele !== 'off') {
    return res.status(400).json({ error: 'rele inválido, usa "on" u "off"' });
  }
  estado.rele = rele;
  res.json(estado);
});

// El ESP32 llama esto para reportar qué hizo realmente y qué mide su sensor
app.post('/api/reporte', (req, res) => {
  const { releReal, luz } = req.body;
  if (releReal === 'on' || releReal === 'off') estado.releReal = releReal;
  if (typeof luz === 'number') estado.luz = luz;
  estado.ultimaConexion = new Date().toISOString();
  res.json({ ok: true });
});

app.listen(PORT, () => {
  console.log(`Servidor escuchando en el puerto ${PORT}`);
});
