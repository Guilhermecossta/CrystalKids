const { v4: uuidv4 } = require('uuid');
const express = require('express');
const fs = require('fs');
const cors = require('cors');
const multer = require('multer');
const path = require('path');

const app = express();
const PORT = 3000;

const DATA_FILE = './produtos.json';
const UPLOAD_FOLDER = path.join(__dirname, 'uploads');

// Cria pasta de uploads se não existir
if (!fs.existsSync(UPLOAD_FOLDER)) {
  fs.mkdirSync(UPLOAD_FOLDER);
}

// Configuração do Multer para salvar imagens no diretório 'uploads'
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_FOLDER),
  filename: (req, file, cb) => {
    const timestamp = Date.now();
    const ext = path.extname(file.originalname);
    const name = path.basename(file.originalname, ext).replace(/\s+/g, '_');
    cb(null, `${name}_${timestamp}${ext}`);
  }
});

const upload = multer({ storage });

app.use(cors());
app.use(express.json());
app.use(express.static('public'));
app.use('/uploads', express.static('uploads')); // Serve as imagens

// Rota de login simples
app.post('/login', (req, res) => {
  const { username, password } = req.body;

  // Usuário e senha fixos (pode trocar aqui)
  const USER = 'admin';
  const PASS = '1234';

  if (username === USER && password === PASS) {
    return res.status(200).json({ message: 'Login OK' });
  } else {
    return res.status(401).json({ message: 'Usuário ou senha inválidos' });
  }
});

// Rota para obter produtos
app.get('/produtos', (req, res) => {
  const produtos = fs.existsSync(DATA_FILE)
    ? JSON.parse(fs.readFileSync(DATA_FILE))
    : [];
  res.json(produtos);
});

// Rota para adicionar produto (com imagem)
app.post('/produtos', upload.single('image'), (req, res) => {
  const { name, price, size, gender } = req.body;
  const image = req.file ? `/uploads/${req.file.filename}` : null;

  if (!name || !price || !size || !gender || !image) {
    return res.status(400).json({ error: 'Campos obrigatórios faltando.' });
  }

  // Gera ID único
  const id = uuidv4();

  const novoProduto = { id, name, price: parseFloat(price), size, gender, image };
  const produtos = fs.existsSync(DATA_FILE)
    ? JSON.parse(fs.readFileSync(DATA_FILE))
    : [];

  produtos.push(novoProduto);
  fs.writeFileSync(DATA_FILE, JSON.stringify(produtos, null, 2));
  res.json({ success: true, produto: novoProduto });
});

// Rota para excluir produto por índice
app.delete('/produtos/:index', (req, res) => {
  const index = parseInt(req.params.index);
  const produtos = fs.existsSync(DATA_FILE)
    ? JSON.parse(fs.readFileSync(DATA_FILE))
    : [];

  if (index < 0 || index >= produtos.length) {
    return res.status(404).json({ error: 'Produto não encontrado.' });
  }

  // Remove imagem associada (opcional)
  const imagemPath = path.join(__dirname, produtos[index].image || '');
  if (fs.existsSync(imagemPath)) {
    fs.unlinkSync(imagemPath);
  }

  produtos.splice(index, 1);
  fs.writeFileSync(DATA_FILE, JSON.stringify(produtos, null, 2));
  res.json({ success: true });
});

app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});
