package com.senai.futebol;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.domain.EntityScan;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;

@SpringBootApplication
@EntityScan(basePackages = "com.senai.futebol.model")
@EnableJpaRepositories(basePackages = "com.senai.futebol.repository")
public class FutebolApplication {

	public static void main(String[] args) {
		SpringApplication.run(FutebolApplication.class, args);
	}
}