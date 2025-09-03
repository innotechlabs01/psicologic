import { Sequelize } from 'sequelize';

const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: './database.sqlite',
  logging: false, // Desactivar logging por defecto
  define: {
    // Opciones globales para todos los modelos
    freezeTableName: true, // Evita que Sequelize pluralice los nombres de las tablas
    timestamps: true, // Habilita los campos createdAt y updatedAt
    charset: 'utf8',
    collate: 'utf8_general_ci'
  },
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000
  }
});

// Función para inicializar la base de datos
export async function initializeDatabase() {
  try {
    // Autenticar la conexión
    await sequelize.authenticate();
    console.log('✅ Conexión a la base de datos establecida correctamente.');

    // Verificar si la base de datos existe
    try {
      await sequelize.query('SELECT 1 FROM User LIMIT 1');
      console.log('✅ Base de datos existente detectada.');
      
      // Si la base existe, solo sincronizar sin alterar
      await sequelize.sync({ alter: false });
      console.log('✅ Modelos sincronizados con la base de datos existente.');
    } catch (err) {
      // Si la tabla no existe, crear desde cero
      if (err.message.includes('no such table')) {
        console.log('⚠️ Base de datos nueva, creando tablas...');
        await sequelize.sync({ force: true });
        console.log('✅ Base de datos inicializada correctamente.');
      } else {
        throw err;
      }
    }

    // Verificar y crear índices necesarios
    await sequelize.transaction(async (t) => {
      // Verificar y crear índices para la tabla User
      await sequelize.query(`
        CREATE INDEX IF NOT EXISTS idx_user_email ON User(email);
        CREATE INDEX IF NOT EXISTS idx_user_link ON User(link);
      `, { transaction: t });

      // Verificar y crear índices para la tabla Payment
      await sequelize.query(`
        CREATE INDEX IF NOT EXISTS idx_payment_userId ON Payment(userId);
        CREATE INDEX IF NOT EXISTS idx_payment_status ON Payment(status);
        CREATE INDEX IF NOT EXISTS idx_payment_paymentDate ON Payment(paymentDate);
      `, { transaction: t });
    });

    console.log('✅ Índices verificados y creados correctamente.');

  } catch (error) {
    console.error('❌ Error al inicializar la base de datos:', error);
    if (error.name === 'SequelizeUniqueConstraintError') {
      console.error('Error de clave única. Intentando recuperar...');
      try {
        // Limpiar tablas de respaldo si existen
        await sequelize.query('DROP TABLE IF EXISTS User_backup');
        await sequelize.query('DROP TABLE IF EXISTS Payment_backup');
        console.log('✅ Tablas de respaldo limpiadas.');
        
        // Reintentar sincronización
        await sequelize.sync({ alter: false });
        console.log('✅ Base de datos recuperada correctamente.');
      } catch (recoveryError) {
        console.error('❌ Error en la recuperación:', recoveryError);
        throw recoveryError;
      }
    } else {
      throw error;
    }
  }
}

export default sequelize;
