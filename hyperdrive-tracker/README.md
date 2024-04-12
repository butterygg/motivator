# How to launch for testnet

## Update dependencies

`hyperdrive-wrappers` and `hyperdrive-math` need to be updated to the version
that corresponds to the testnetlaunch.

`calculate_close_long` and `…_short` will need updating as their signatures will
have changed.

## Gather script inputs

- Get the contracts addresses.
- Get the start block number and end block number.

## Produce datasets

Launch 1 script per contract.
