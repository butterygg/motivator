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

- Launch script

# Testnet launch

Sepolia hyperdrive addresses:

```yaml
- pool_type: "4626"
  address: 0x392839da0dacac790bd825c81ce2c5e264d793a8
  deploy_block: 5664183
- pool_type: stETH
  address: 0xff33bd6d7ed4119c99c310f3e5f0fa467796ee23
  deploy_block: 5663018
- pool_type: "4626"
  address: 0x0436b07823da988484b70309b0d1b509eadd2173
  deploy_block: 5755457
- pool_type: stETH
  address: 0x72e19347512c194a6812c72934bf0439ffb31a26
  deploy_block: 5768223
- pool_type: stETH
  address: 0x4e38fd41c03ff11b3426efae53138b86116797b8
  deploy_block: 5663061
- pool_type: "4626"
  address: 0xb932f8085399c228b16a9f7fc3219d47ffa2810d
  deploy_block: 5664214
```

# Launch script

```
cargo r -- acq 4626 0xb932f8085399c228b16a9f7fc3219d47ffa2810d 5663018
cargo r -- agg 4626 0xb932f8085399c228b16a9f7fc3219d47ffa2810d 5663018
```
