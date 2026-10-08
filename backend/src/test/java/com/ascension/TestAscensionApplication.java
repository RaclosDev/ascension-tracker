package com.ascension;

import org.springframework.boot.SpringApplication;

public class TestAscensionApplication {

    public static void main(String[] args) {
        SpringApplication.from(AscensionApplication::main).with(TestcontainersConfiguration.class).run(args);
    }
}
