CREATE TABLE `suppressed_alerts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`network` varchar(32) NOT NULL,
	`tokenPair` varchar(64) NOT NULL,
	`netProfitUsd` varchar(32) NOT NULL,
	`thresholdUsd` varchar(32) NOT NULL,
	`txHash` varchar(128) NOT NULL,
	`reason` varchar(255) NOT NULL,
	`timestamp` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `suppressed_alerts_id` PRIMARY KEY(`id`)
);
