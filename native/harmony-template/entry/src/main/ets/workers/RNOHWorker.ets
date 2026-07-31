import { setupRNOHWorker } from '@rnoh/react-native-openharmony/src/main/ets/setupRNOHWorker';
import { getRNOHPackages } from '../PackageProvider';

setupRNOHWorker({
  createWorkerRNInstanceConfig: (_rnInstanceName) => ({
    thirdPartyPackagesFactory: getRNOHPackages,
  }),
});
