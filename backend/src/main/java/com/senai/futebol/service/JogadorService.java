package com.senai.futebol.service;

import com.senai.futebol.dto.*;
import com.senai.futebol.exception.NegocioException;
import com.senai.futebol.exception.RecursoNotFoundException;
import com.senai.futebol.exception.ValidacaoException;
import com.senai.futebol.model.JogadorModel;
import com.senai.futebol.repository.EscalacaoRepository;
import com.senai.futebol.repository.JogadorRepository;
import com.senai.futebol.util.TextoUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class JogadorService {

    private final JogadorRepository repository;

    @Autowired(required = false)
    private EscalacaoRepository escalacaoRepository;

    public JogadorService(JogadorRepository repository) {
        this(repository, null);
    }

    @Autowired
    public JogadorService(JogadorRepository repository, @Autowired(required = false) EscalacaoRepository escalacaoRepository) {
        this.repository = repository;
        this.escalacaoRepository = escalacaoRepository;
    }

    @Transactional
    public JogadorResponseDTO cadastrar(JogadorRequestDTO dto) {
        if (dto.getName() == null || !TextoUtils.validarNomeJogador(dto.getName())) {
            throw new ValidacaoException("Nome do jogador deve ter entre 3 e 100 caracteres, pelo menos duas palavras e nenhum dígito.");
        }

        String posicao = dto.getPosition();
        if (posicao == null || !List.of("GOL", "ZAG", "LAT", "MEI", "ATA").contains(posicao)) {
            throw new ValidacaoException("Posição inválida. Aceitas: GOL, ZAG, LAT, MEI ou ATA.");
        }

        int idade = dto.getAge() != null ? dto.getAge() : 0;
        if (idade < 16 || idade > 45) {
            throw new ValidacaoException("Idade deve estar entre 16 e 45 anos.");
        }

        int agilidade = dto.getAgilidade() != null ? dto.getAgilidade() : 0;
        if (agilidade < 1 || agilidade > 100) {
            throw new ValidacaoException("Agilidade deve estar entre 1 e 100.");
        }
        if (idade >= 35 && agilidade > 85) {
            throw new ValidacaoException("Jogador com 35 anos ou mais pode ter no máximo 85 de agilidade.");
        }

        int vel = validarAtributo("pace (velocidade)", dto.getPace());
        int fin = validarAtributo("shooting (finalização)", dto.getShooting());
        int pas = validarAtributo("passing (passe)", dto.getPassing());
        int dri = validarAtributo("dribbling (drible)", dto.getDribbling());
        int def = validarAtributo("defending (defesa)", dto.getDefending());
        int fis = validarAtributo("physical (físico)", dto.getPhysical());

        int soma = vel + fin + pas + dri + def + fis;
        if (soma > 480) {
            throw new ValidacaoException("A soma dos 6 atributos técnicos não pode ultrapassar 480.");
        }

        int maiorAtributo = Math.max(Math.max(Math.max(vel, fin), Math.max(pas, dri)), Math.max(def, fis));
        int potencial = dto.getPotential() != null ? dto.getPotential() : 0;
        if (potencial < 1 || potencial > 99) {
            throw new ValidacaoException("Potencial deve estar entre 1 e 99.");
        }

        if (idade >= 33) {
            if (potencial != maiorAtributo) {
                throw new ValidacaoException("No cadastro de jogador com 33 anos ou mais, o potencial deve ser igual ao maior dos seis atributos (" + maiorAtributo + ").");
            }
        } else {
            if (potencial < maiorAtributo) {
                throw new ValidacaoException("O potencial não pode ser menor que o maior dos 6 atributos.");
            }
        }

        JogadorModel jogador = new JogadorModel();
        jogador.setNome(TextoUtils.limparEspacos(dto.getName()));
        jogador.setPosicao(posicao);
        jogador.setAgilidade(agilidade);
        jogador.setIdade(idade);
        jogador.setVelocidade(vel);
        jogador.setFinalizacao(fin);
        jogador.setPasse(pas);
        jogador.setDrible(dri);
        jogador.setDefesa(def);
        jogador.setFisico(fis);
        jogador.setPotencial(potencial);
        jogador.setCondicao("APTO");

        int overall = calcularOverall(jogador);
        BigDecimal valorBase = calcularValorBase(overall, idade, potencial);
        jogador.setValorBase(valorBase);

        Instant agora = Instant.now();
        jogador.setCriadoEm(agora);
        jogador.setAtualizadoEm(agora);

        JogadorModel salvo = repository.save(jogador);
        return converterParaDto(salvo);
    }

    private int validarAtributo(String nome, Integer valor) {
        if (valor == null || valor < 1 || valor > 99) {
            throw new ValidacaoException("Atributo " + nome + " deve estar entre 1 e 99.");
        }
        return valor;
    }

    public JogadorModel salvarJogador(JogadorModel jogador) {
        int overall = calcularOverall(jogador);

        int velocidade = jogador.getVelocidade() != null ? jogador.getVelocidade() : 0;
        int finalizacao = jogador.getFinalizacao() != null ? jogador.getFinalizacao() : 0;
        int passe = jogador.getPasse() != null ? jogador.getPasse() : 0;
        int drible = jogador.getDrible() != null ? jogador.getDrible() : 0;
        int defesa = jogador.getDefesa() != null ? jogador.getDefesa() : 0;
        int fisico = jogador.getFisico() != null ? jogador.getFisico() : 0;
        int potencial = jogador.getPotencial() != null ? jogador.getPotencial() : 0;
        int idade = jogador.getIdade() != null ? jogador.getIdade() : 0;

        int somaAtributos = velocidade + finalizacao + passe + drible + defesa + fisico;
        if (somaAtributos > 480) {
            throw new IllegalArgumentException("A soma dos 6 atributos técnicos não pode ultrapassar 480.");
        }

        int maiorAtributo = Math.max(Math.max(Math.max(velocidade, finalizacao), Math.max(passe, drible)), Math.max(defesa, fisico));
        if (potencial < maiorAtributo) {
            throw new IllegalArgumentException("O potencial não pode ser menor que o maior dos 6 atributos.");
        }

        BigDecimal valorBase = calcularValorBase(overall, idade, potencial);
        jogador.setValorBase(valorBase);

        if (jogador.getCondicao() == null) {
            jogador.setCondicao("APTO");
        }

        Instant agora = Instant.now();
        if (jogador.getCriadoEm() == null) {
            jogador.setCriadoEm(agora);
        }
        jogador.setAtualizadoEm(agora);

        return repository.save(jogador);
    }

    public int calcularOverall(JogadorModel jogador) {
        int pesoVelocidade = 0, pesoFinalizacao = 0, pesoPasse = 0;
        int pesoDrible = 0, pesoDefesa = 0, pesoFisico = 0;

        int vel = jogador.getVelocidade() != null ? jogador.getVelocidade() : 0;
        int fin = jogador.getFinalizacao() != null ? jogador.getFinalizacao() : 0;
        int pas = jogador.getPasse() != null ? jogador.getPasse() : 0;
        int dri = jogador.getDrible() != null ? jogador.getDrible() : 0;
        int def = jogador.getDefesa() != null ? jogador.getDefesa() : 0;
        int fis = jogador.getFisico() != null ? jogador.getFisico() : 0;

        if (jogador.getPosicao() != null) {
            switch (jogador.getPosicao().toUpperCase()) {
                case "GOL":
                    pesoVelocidade = 10; pesoPasse = 20; pesoDefesa = 40; pesoFisico = 30;
                    break;
                case "ZAG":
                    pesoVelocidade = 10; pesoPasse = 15; pesoDefesa = 45; pesoFisico = 30;
                    break;
                case "LAT":
                    pesoVelocidade = 25; pesoPasse = 20; pesoDrible = 15; pesoDefesa = 25; pesoFisico = 15;
                    break;
                case "MEI":
                    pesoVelocidade = 10; pesoFinalizacao = 15; pesoPasse = 35; pesoDrible = 25; pesoDefesa = 5; pesoFisico = 10;
                    break;
                case "ATA":
                    pesoVelocidade = 20; pesoFinalizacao = 40; pesoPasse = 10; pesoDrible = 20; pesoFisico = 10;
                    break;
            }
        }

        int somaProdutos = (vel * pesoVelocidade) +
                (fin * pesoFinalizacao) +
                (pas * pesoPasse) +
                (dri * pesoDrible) +
                (def * pesoDefesa) +
                (fis * pesoFisico);

        double media = somaProdutos / 100.0;
        return (int) Math.round(media);
    }

    public BigDecimal calcularValorBase(int overall, int idade, int potencial) {
        double parteOverall = 0.0;

        if (overall > 40 && overall <= 60) {
            parteOverall = (overall - 40) * 0.50;
        } else if (overall > 60 && overall <= 75) {
            parteOverall = (20 * 0.50) + ((overall - 60) * 2.00);
        } else if (overall > 75 && overall <= 99) {
            parteOverall = (20 * 0.50) + (15 * 2.00) + ((overall - 75) * 6.00);
        }

        if (idade <= 21) {
            parteOverall = parteOverall * ((100.0 + potencial - overall) / 100.0);
        }

        BigDecimal valorFinal = BigDecimal.valueOf(parteOverall).setScale(2, RoundingMode.HALF_UP);

        if (valorFinal.compareTo(BigDecimal.ONE) < 0) {
            return BigDecimal.ONE.setScale(2);
        }

        return valorFinal;
    }

    public BigDecimal calcularValorDeMercado(JogadorModel jogador) {
        double valorBase = jogador.getValorBase() != null ? jogador.getValorBase().doubleValue() : 0.0;

        double descontoCondicao = 0.0;
        String condicao = jogador.getCondicao() != null ? jogador.getCondicao() : "APTO";

        if (condicao.equals("MAL_CONDICIONADO")) {
            descontoCondicao = 15.0;
        } else if (condicao.equals("DOENTE")) {
            descontoCondicao = 30.0;
        }

        int agilidade = jogador.getAgilidade();
        if (!condicao.equals("APTO")) {
            if (agilidade >= 80 && agilidade <= 100) {
                descontoCondicao = descontoCondicao / 2.0;
            } else if (agilidade >= 1 && agilidade <= 30) {
                descontoCondicao = descontoCondicao + 10.0;
            }
        }

        double ajusteIdade = 0.0;
        int idade = jogador.getIdade();
        if (idade <= 21) {
            ajusteIdade = 10.0;
        } else if (idade >= 32) {
            ajusteIdade = -10.0;
        }

        double percentualTotal = ajusteIdade - descontoCondicao;

        if (percentualTotal < -40.0) {
            percentualTotal = -40.0;
        }

        double valorMercado = valorBase * (100.0 + percentualTotal) / 100.0;

        BigDecimal resultado = BigDecimal.valueOf(valorMercado).setScale(2, RoundingMode.HALF_UP);
        if (resultado.compareTo(BigDecimal.ONE) < 0) {
            return BigDecimal.ONE.setScale(2);
        }

        return resultado;
    }

    public JogadorModel buscarPoId(Integer id) {
        return repository.findByIdAndExcluidoEmIsNull(id).orElse(null);
    }

    public JogadorResponseDTO buscarDtoPorId(Integer id) {
        JogadorModel jogador = repository.findByIdAndExcluidoEmIsNull(id)
                .orElseThrow(() -> new RecursoNotFoundException("Jogador não encontrado ou excluído."));
        return converterParaDto(jogador);
    }

    public List<JogadorModel> listarTodosJogadores() {
        return repository.findByExcluidoEmIsNull();
    }

    @Transactional
    public JogadorResponseDTO atualizar(Integer id, JogadorUpdateRequestDTO dto) {
        JogadorModel jogador = repository.findByIdAndExcluidoEmIsNull(id)
                .orElseThrow(() -> new RecursoNotFoundException("Jogador não encontrado ou excluído."));

        if (dto.getName() == null || !TextoUtils.validarNomeJogador(dto.getName())) {
            throw new ValidacaoException("Nome do jogador deve ter entre 3 e 100 caracteres, pelo menos duas palavras e nenhum dígito.");
        }

        if (dto.getAge() == null || dto.getAge() < 16 || dto.getAge() > 45) {
            throw new ValidacaoException("Idade deve estar entre 16 e 45 anos.");
        }

        if (dto.getAge() < jogador.getIdade()) {
            throw new NegocioException("A nova idade não pode ser menor que a idade atual.");
        }

        if (dto.getAgility() == null || dto.getAgility() < 1 || dto.getAgility() > 100) {
            throw new ValidacaoException("Agilidade deve estar entre 1 e 100.");
        }
        if (dto.getAge() >= 35 && dto.getAgility() > 85) {
            throw new ValidacaoException("Jogador com 35 anos ou mais pode ter no máximo 85 de agilidade.");
        }

        String novaPosicao = dto.getPosition();
        if (novaPosicao == null || !List.of("GOL", "ZAG", "LAT", "MEI", "ATA").contains(novaPosicao)) {
            throw new ValidacaoException("Posição inválida. Aceitas: GOL, ZAG, LAT, MEI ou ATA.");
        }

        // RN08: Jogador com clube não muda de posição (409)
        if (jogador.getClube() != null && !jogador.getPosicao().equalsIgnoreCase(novaPosicao)) {
            throw new NegocioException("Jogador com clube não pode mudar de posição.");
        }

        jogador.setNome(TextoUtils.limparEspacos(dto.getName()));
        jogador.setPosicao(novaPosicao);
        jogador.setAgilidade(dto.getAgility());
        jogador.setIdade(dto.getAge());
        jogador.setAtualizadoEm(Instant.now());

        JogadorModel atualizado = repository.save(jogador);
        return converterParaDto(atualizado);
    }

    public JogadorModel atualizarJogador(Integer id, JogadorModel dadosAtualizados) {
        JogadorModel jogador = buscarPoId(id);
        if (jogador == null) {
            return null;
        }

        if (dadosAtualizados.getIdade() < jogador.getIdade()) {
            throw new IllegalArgumentException("A nova idade não pode ser menor que a idade atual.");
        }

        jogador.setNome(dadosAtualizados.getNome());
        jogador.setPosicao(dadosAtualizados.getPosicao());
        jogador.setAgilidade(dadosAtualizados.getAgilidade());
        jogador.setIdade(dadosAtualizados.getIdade());
        jogador.setAtualizadoEm(Instant.now());

        return repository.save(jogador);
    }

    @Transactional
    public JogadorResponseDTO alterarCondicaoDto(Integer id, String novaCondicao) {
        JogadorModel jogador = repository.findByIdAndExcluidoEmIsNull(id)
                .orElseThrow(() -> new RecursoNotFoundException("Jogador não encontrado ou excluído."));

        if (novaCondicao == null || !List.of("APTO", "MAL_CONDICIONADO", "DOENTE").contains(novaCondicao)) {
            throw new ValidacaoException("Condição inválida. Aceitas: APTO, MAL_CONDICIONADO ou DOENTE.");
        }

        String condicaoAtual = jogador.getCondicao() != null ? jogador.getCondicao() : "APTO";

        // De DOENTE não vai direto para APTO (409)
        if (condicaoAtual.equals("DOENTE") && novaCondicao.equals("APTO")) {
            throw new NegocioException("Um jogador doente não pode ir diretamente para apto.");
        }

        jogador.setCondicao(novaCondicao);
        jogador.setAtualizadoEm(Instant.now());
        JogadorModel salvo = repository.save(jogador);

        // RN19: Se o jogador passa para DOENTE e está escalado, sai da escalação
        if ("DOENTE".equals(novaCondicao) && escalacaoRepository != null) {
            escalacaoRepository.deleteByJogadorId(id);
        }

        return converterParaDto(salvo);
    }

    public JogadorModel alterarCondicao(Integer id, String novaCondicao) {
        JogadorModel jogador = buscarPoId(id);
        if (jogador == null) {
            return null;
        }

        String condicaoAtual = jogador.getCondicao() != null ? jogador.getCondicao() : "APTO";

        if (condicaoAtual.equals("DOENTE") && novaCondicao.equals("APTO")) {
            throw new IllegalArgumentException("Um jogador doente não pode ir diretamente para apto.");
        }

        jogador.setCondicao(novaCondicao);
        jogador.setAtualizadoEm(Instant.now());
        return repository.save(jogador);
    }

    @Transactional
    public void excluir(Integer id) {
        JogadorModel jogador = repository.findByIdAndExcluidoEmIsNull(id)
                .orElseThrow(() -> new RecursoNotFoundException("Jogador não encontrado ou já excluído."));

        // RN09: só jogador livre pode ser excluído; jogador no elenco de um clube -> 409
        if (jogador.getClube() != null) {
            throw new NegocioException("Jogador pertencente a um clube não pode ser excluído.");
        }

        jogador.setExcluidoEm(Instant.now());
        jogador.setAtualizadoEm(Instant.now());
        repository.save(jogador);
    }

    public boolean excluirJogador(Integer id) {
        JogadorModel jogador = buscarPoId(id);
        if (jogador == null) {
            return false;
        }

        jogador.setExcluidoEm(Instant.now());
        jogador.setAtualizadoEm(Instant.now());
        repository.save(jogador);
        return true;
    }

    public PaginatedResponseDTO<JogadorResponseDTO> listarComFiltrosAvancados(
            String search,
            String position,
            String condition,
            Boolean free,
            Integer clubId,
            Integer minAge,
            Integer maxAge,
            BigDecimal minValue,
            BigDecimal maxValue,
            String sort,
            int page,
            int limit) {

        if (page < 1) {
            throw new ValidacaoException("Page deve ser maior ou igual a 1.");
        }
        if (limit < 1 || limit > 50) {
            throw new ValidacaoException("Limit deve estar entre 1 e 50.");
        }
        if (minAge != null && maxAge != null && minAge > maxAge) {
            throw new ValidacaoException("min_age não pode ser maior que max_age.");
        }
        if (minValue != null && maxValue != null && minValue.compareTo(maxValue) > 0) {
            throw new ValidacaoException("min_value não pode ser maior que max_value.");
        }
        if (Boolean.TRUE.equals(free) && clubId != null) {
            throw new ValidacaoException("Não é permitido combinar free=true com club_id.");
        }

        List<JogadorModel> todos = repository.findByExcluidoEmIsNull();

        List<JogadorResponseDTO> filtrados = todos.stream()
                .map(this::converterParaDto)
                .filter(j -> {
                    if (search != null && !search.isBlank()) {
                        String normNome = TextoUtils.normalizar(j.getName());
                        String normSearch = TextoUtils.normalizar(search.trim());
                        if (!normNome.contains(normSearch)) return false;
                    }
                    if (position != null && !position.isBlank()) {
                        if (!j.getPosition().equalsIgnoreCase(position)) return false;
                    }
                    if (condition != null && !condition.isBlank()) {
                        if (!j.getCondition().equalsIgnoreCase(condition)) return false;
                    }
                    if (free != null) {
                        if (free && j.getClubId() != null) return false;
                        if (!free && j.getClubId() == null) return false;
                    }
                    if (clubId != null) {
                        if (!Objects.equals(j.getClubId(), clubId)) return false;
                    }
                    if (minAge != null && j.getAge() < minAge) return false;
                    if (maxAge != null && j.getAge() > maxAge) return false;
                    if (minValue != null && j.getMarketValue().compareTo(minValue) < 0) return false;
                    if (maxValue != null && j.getMarketValue().compareTo(maxValue) > 0) return false;
                    return true;
                })
                .collect(Collectors.toList());

        // Ordenação
        Comparator<JogadorResponseDTO> comparator = criarComparator(sort);
        filtrados.sort(comparator);

        int totalItems = filtrados.size();
        int totalPages = totalItems == 0 ? 0 : (int) Math.ceil((double) totalItems / limit);

        int fromIndex = (page - 1) * limit;
        List<JogadorResponseDTO> paginaItens;
        if (fromIndex >= totalItems) {
            paginaItens = Collections.emptyList();
        } else {
            int toIndex = Math.min(fromIndex + limit, totalItems);
            paginaItens = filtrados.subList(fromIndex, toIndex);
        }

        PaginatedResponseDTO.MetaDTO meta = new PaginatedResponseDTO.MetaDTO(page, limit, (long) totalItems, totalPages);
        return new PaginatedResponseDTO<>(paginaItens, meta);
    }

    private Comparator<JogadorResponseDTO> criarComparator(String sort) {
        Comparator<JogadorResponseDTO> base = Comparator
                .comparing((JogadorResponseDTO j) -> TextoUtils.normalizar(j.getName()))
                .thenComparing(JogadorResponseDTO::getId);

        if (sort == null || sort.isBlank() || sort.equals("name")) {
            return base;
        }

        String[] criterios = sort.split(",");
        Comparator<JogadorResponseDTO> comp = null;

        for (String crit : criterios) {
            Comparator<JogadorResponseDTO> c = switch (crit.trim()) {
                case "value_asc" -> Comparator.comparing(JogadorResponseDTO::getMarketValue);
                case "value_desc" -> Comparator.comparing(JogadorResponseDTO::getMarketValue).reversed();
                case "age_asc" -> Comparator.comparing(JogadorResponseDTO::getAge);
                case "age_desc" -> Comparator.comparing(JogadorResponseDTO::getAge).reversed();
                case "position" -> Comparator.comparing((JogadorResponseDTO j) -> prioridadePosicao(j.getPosition()));
                default -> null;
            };

            if (c != null) {
                comp = (comp == null) ? c : comp.thenComparing(c);
            }
        }

        return (comp == null) ? base : comp.thenComparing(base);
    }

    private int prioridadePosicao(String pos) {
        if (pos == null) return 99;
        return switch (pos.toUpperCase()) {
            case "GOL" -> 1;
            case "ZAG" -> 2;
            case "LAT" -> 3;
            case "MEI" -> 4;
            case "ATA" -> 5;
            default -> 99;
        };
    }

    public Page<JogadorModel> listarComFiltros(String search, String posicao, String condicao, Pageable pageable) {
        return repository.filtrarJogadores(search, posicao, condicao, pageable);
    }

    public JogadorResponseDTO converterParaDto(JogadorModel j) {
        JogadorResponseDTO dto = new JogadorResponseDTO();
        dto.setId(j.getId());
        dto.setName(j.getNome());
        dto.setPosition(j.getPosicao());
        dto.setAgility(j.getAgilidade());
        dto.setAge(j.getIdade());
        dto.setCondition(j.getCondicao());
        dto.setBaseValue(j.getValorBase());
        dto.setMarketValue(calcularValorDeMercado(j));
        dto.setPace(j.getVelocidade());
        dto.setShooting(j.getFinalizacao());
        dto.setPassing(j.getPasse());
        dto.setDribbling(j.getDrible());
        dto.setDefending(j.getDefesa());
        dto.setPhysical(j.getFisico());
        dto.setPotential(j.getPotencial());
        dto.setOverall(calcularOverall(j));
        dto.setClubId(j.getClube() != null ? j.getClube().getId() : null);
        return dto;
    }
}