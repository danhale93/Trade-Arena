CREATE TABLE `simulation_route_history` (
	`id` int AUTO_INCREMENT NOT NULL,
	`network` varchar(32) NOT NULL,
	`route` varchar(255) NOT NULL,
	`netProfitUsd` varchar(32) NOT NULL,
	`profitable` int NOT NULL DEFAULT 0,
	`spreadBps` int NOT NULL DEFAULT 0,
	`source` varchar(32) NOT NULL DEFAULT 'simulation',
	`timestamp` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `simulation_route_history_id` PRIMARY KEY(`id`)
);
