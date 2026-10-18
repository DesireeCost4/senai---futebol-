import api from './api';

export const clubeService = {
  // Equivalente a um método getClubes() 
  listarClubes: async () => {
    try {
      const response = await api.get('/clubes'); 
      return response.data;
    } catch (error) {
      console.error('Erro ao listar clubes:', error);
      throw error;
    }
  },

  //Equivalencia método criarClube para facilitar 
  criarClube: async (dadosClube) => {
    try {
      const response = await api.post('/clubes', dadosClube);
      return response.data;
    } catch (error) {
      console.error('Erro ao criar clube:', error);
      throw error;
    }
  }
};