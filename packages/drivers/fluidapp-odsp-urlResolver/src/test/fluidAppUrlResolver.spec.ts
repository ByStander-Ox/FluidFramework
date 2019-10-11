/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { IOdspResolvedUrl } from "@microsoft/fluid-odsp-driver";
import * as assert from "assert";
import { FluidAppOdspUrlResolver } from "../urlResolver";

describe("Fluid App Url Resolver", () => {

    it("Should resolve the fluid app urls correctly", async () => {
        const urlResolver = new FluidAppOdspUrlResolver();
        // tslint:disable-next-line: max-line-length
        const resolved = (await urlResolver.resolve({ url: "https://dev.fluid.office.com/p/c3BvOmh0dHBzOi8vbWljcm9zb2Z0LnNoYXJlcG9pbnQtZGYuY29tL3RlYW1zL09mZmljZU9ubGluZVByYWd1ZQ%3D%3D/randomDrive/randomItem/OXO-Dogfood-remaining-items?nav=&e=_Ha3TtNhQEaX-jy2yOQM3A&at=15&scriptVersion=3016031" })) as IOdspResolvedUrl;
        assert.equal(resolved.driveId,
            "randomDrive", "Drive id does not match");
        assert.equal(resolved.itemId, "randomItem", "Item id does not match");
        assert.equal(resolved.siteUrl,
            "https://microsoft.sharepoint-df.com/teams/OfficeOnlinePrague", "Site id does not match");
        // tslint:disable-next-line: max-line-length
        assert.equal(resolved.endpoints.snapshotStorageUrl, "https://microsoft.sharepoint-df.com/_api/v2.1/drives/randomDrive/items/randomItem/opStream/snapshots", "SnashotStorageUrl does not match");
    });
});