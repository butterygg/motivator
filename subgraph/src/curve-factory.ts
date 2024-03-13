import {
  PlainPoolDeployed as PlainPoolDeployedEvent,
  LiquidityGaugeDeployed as LiquidityGaugeDeployedEvent,
  CurveFactory,
} from "../generated/StableSwapNGFactory/CurveFactory";
import { CurveGauge } from "../generated/StableSwapNGFactory/CurveGauge";
import {
  CurveGauge as CurveGaugeTemplate,
  CurvePool as CurvePoolTemplate,
  LusDAO as LusDAOTemplate,
} from "../generated/templates";
import {
  Address,
  DataSourceContext,
  dataSource,
} from "@graphprotocol/graph-ts";

function isUsualPool(coins: Address[]): boolean {
  if (coins.length !== 2) return false;

  const coin1 = coins[0];
  const coin2 = coins[1];

  const stbc = Address.fromBytes(dataSource.context().getBytes("stbc"));
  if (!coin1.equals(stbc) && !coin2.equals(stbc)) return false;

  const usdc = Address.fromBytes(dataSource.context().getBytes("usdc"));
  if (coin1.equals(usdc) || coin2.equals(usdc)) return true;

  return false;
}

export function handlePlainPoolDeployed(event: PlainPoolDeployedEvent): void {
  if (!isUsualPool(event.params.coins)) return;

  const stableSwapNGFactory = CurveFactory.bind(event.address);
  const curvePool = stableSwapNGFactory.find_pool_for_coins1(
    event.params.coins[0],
    event.params.coins[1]
  );
  CurvePoolTemplate.create(curvePool);
}

export function handleLiquidityGaugeDeployed(
  event: LiquidityGaugeDeployedEvent
): void {
  const curveGauge = CurveGauge.bind(event.params.gauge);
  const curvePool = curveGauge.lp_token();

  const stableSwapNGFactory = CurveFactory.bind(event.address);
  const coins = stableSwapNGFactory.get_coins(curvePool);

  if (!isUsualPool(coins)) return;

  CurveGaugeTemplate.create(event.params.gauge);

  const context = new DataSourceContext();
  context.setBytes("curvePool", curvePool);
  context.setBytes("curveGauge", event.params.gauge);

  // TODO: Test this with multiple Curve Pools
  const lusdao = Address.fromBytes(dataSource.context().getBytes("lusdao"));
  LusDAOTemplate.createWithContext(lusdao, context);
}
