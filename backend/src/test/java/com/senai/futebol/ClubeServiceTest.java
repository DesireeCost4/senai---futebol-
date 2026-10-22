package com.senai.futebol;

import com.senai.futebol.model.ClubeModel;
import com.senai.futebol.repository.ClubeRepository;
import com.senai.futebol.service.ClubeService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ClubeServiceTest {

    @Mock
    private ClubeRepository clubeRepository;

    @InjectMocks
    private ClubeService clubeService;

    private ClubeModel clube;

    @BeforeEach
    void setUp() {
        clube = new ClubeModel();
        clube.setNome("Águias FC");
        clube.setSigla("AGU");
    }

    @Test
    @DisplayName("Deve salvar um clube com sucesso definindo o caixa inicial")
    void deveSalvarClubeComSucesso() {
        // Arrange
        when(clubeRepository.count()).thenReturn(5L);
        when(clubeRepository.nomeCadastrado(any())).thenReturn(false);
        when(clubeRepository.siglaCadastrada(any())).thenReturn(false);
        when(clubeRepository.save(any(ClubeModel.class))).thenReturn(clube);

        // Act
        ClubeModel resultado = clubeService.salvarClube(clube);

        // Assert
        assertNotNull(resultado);
        assertEquals(new BigDecimal("300.00"), resultado.getCaixa());
        verify(clubeRepository, times(1)).save(any(ClubeModel.class));
    }

    @Test
    @DisplayName("Deve lançar exceção ao tentar cadastrar clube com nome já existente")
    void deveLancarExcecaoNomeDuplicado() {
        // Arrange
        when(clubeRepository.count()).thenReturn(2L);
        when(clubeRepository.nomeCadastrado("Águias FC")).thenReturn(true);

        // Act & Assert
        IllegalArgumentException exception = assertThrows(IllegalArgumentException.class, () -> {
            clubeService.salvarClube(clube);
        });

        assertEquals("Já existe um clube cadastrado com este nome.", exception.getMessage());
        verify(clubeRepository, never()).save(any());
    }

    @Test
    @DisplayName("Deve lançar exceção ao tentar cadastrar clube com sigla já existente")
    void deveLancarExcecaoSiglaDuplicada() {
        // Arrange
        when(clubeRepository.count()).thenReturn(2L);
        when(clubeRepository.nomeCadastrado(any())).thenReturn(false);
        when(clubeRepository.siglaCadastrada("AGU")).thenReturn(true);

        // Act & Assert
        IllegalArgumentException exception = assertThrows(IllegalArgumentException.class, () -> {
            clubeService.salvarClube(clube);
        });

        assertEquals("Já existe um clube cadastrado com esta sigla.", exception.getMessage());
        verify(clubeRepository, never()).save(any());
    }

    @Test
    @DisplayName("Deve lançar exceção ao atingir o limite máximo de 20 clubes na liga")
    void deveLancarExcecaoLimiteClubes() {
        // Arrange
        when(clubeRepository.count()).thenReturn(20L);

        // Act & Assert
        IllegalArgumentException exception = assertThrows(IllegalArgumentException.class, () -> {
            clubeService.salvarClube(clube);
        });

        assertEquals("A liga atingiu o limite máximo de 20 clubes.", exception.getMessage());
        verify(clubeRepository, never()).save(any());
    }
}
