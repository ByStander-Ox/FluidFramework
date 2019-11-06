/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import {
    IComponent,
    IComponentConfiguration,
    IRequest,
    IResponse,
} from "@microsoft/fluid-component-core-interfaces";
import {
    IClientDetails,
    IDocumentMessage,
    IDocumentStorageService,
    ISequencedDocumentMessage,
    IServiceConfiguration,
    ISnapshotTree,
    ITree,
    MessageType,
} from "@microsoft/fluid-protocol-definitions";
import { EventEmitter } from "events";
import { IAudience } from "./audience";
import { IBlobManager } from "./blobs";
import { IQuorum } from "./consensus";
import { IDeltaManager } from "./deltas";
import { ICodeLoader, ILoader } from "./loader";
import { ITelemetryLogger } from "./logger";

/**
 * Person definition in a npm script
 */
export interface IPerson {
    name: string;
    email: string;
    url: string;
}

/**
 * Typescript interface definition for fields within a NPM module's package.json.
 */
export interface IPackage {
    // general access for extended fields
    [key: string]: any;
    name: string;
    version: string;
    description?: string;
    keywords?: string[];
    homepage?: string;
    bugs?: { url: string; email: string };
    license?: string;
    author?: IPerson;
    contributors?: IPerson[];
    files?: string[];
    main?: string;
    // Same as main but for browser based clients (check if webpack supports this)
    browser?: string;
    bin?: { [key: string]: string };
    man?: string | string[];
    repository?: string | { type: string; url: string };
    scripts?: { [key: string]: string };
    config?: { [key: string]: string };
    dependencies?: { [key: string]: string };
    devDependencies?: { [key: string]: string };
    peerDependencies?: { [key: string]: string };
    bundledDependencies?: { [key: string]: string };
    optionalDependencies?: { [key: string]: string };
    engines?: { node: string; npm: string };
    os?: string[];
    cpu?: string[];
    private?: boolean;
}

export interface IFluidPackage extends IPackage {
    // https://stackoverflow.com/questions/10065564/add-custom-metadata-or-config-to-package-json-is-it-valid
    fluid: {
        browser: {
            [libraryTarget: string]: {
                // List of bundled JS files. Absolute URLs will be loaded directly. Relative paths will be specific
                // to the CDN location
                files: string[];

                // if libraryTarget is umd then library is the global name that the script entry points will be exposed
                // under. Other target formats may choose to reinterpret this value.
                library: string;
            };
        };
    };
}

/**
 * Check if the package.json defines a fluid module, which requires a `fluid` entry
 * @param pkg - the package json data to check if it is a fluid package.
 */
export function isFluidPackage(pkg: IPackage): pkg is IFluidPackage {
    // tslint:disable-next-line: no-unsafe-any
    return pkg.fluid && pkg.fluid.browser && pkg.fluid.browser.umd;
}

export enum ConnectionState {
    /**
     * The document is no longer connected to the delta server
     */
    Disconnected,

    /**
     * The document has an inbound connection but is still pending for outbound deltas
     */
    Connecting,

    /**
     * The document is fully connected
     */
    Connected,
}

/**
 * Package manager configuration. Provides a key value mapping of config values
 */
export interface IPackageConfig {
    [key: string]: string;
}

/**
 * Data structure used to describe the code to load on the Fluid document
 */
export interface IFluidCodeDetails {
    /**
     * The code package to be used on the Fluid document. This is either the package name which will be loaded
     * from a package manager. Or the expanded fluid package.
     */
    package: string | IFluidPackage;

    /**
     * Configuration details. This includes links to the package manager and base CDNs.
     */
    config: IPackageConfig;
}

/**
 * The IRuntime represents an instantiation of a code package within a container.
 */
export interface IRuntime {

    /**
     * Executes a request against the runtime
     */
    request(request: IRequest): Promise<IResponse>;

    /**
     * Snapshots the runtime
     */
    snapshot(tagMessage: string, fullTree?: boolean): Promise<ITree | null>;

    /**
     * Notifies the runtime of a change in the connection state
     */
    changeConnectionState(value: ConnectionState, clientId: string, version?: string);

    /**
     * Stops the runtime. Once stopped no more messages will be delivered and the context passed to the runtime
     * on creation will no longer be active
     */
    stop(): Promise<void>;

    /**
     * Processes the given message
     */
    process(message: ISequencedDocumentMessage, local: boolean, context: any);

    /**
     * Called immediately after a message has been processed but prior to the next message being executed
     * @deprecated being removed and replaced with only process
     */
    postProcess?(message: ISequencedDocumentMessage, local: boolean, context: any): Promise<void>;

    /**
     * Processes the given signal
     */
    processSignal(message: any, local: boolean);
}

export interface IMessageScheduler {
    readonly deltaManager: IDeltaManager<ISequencedDocumentMessage, IDocumentMessage>;
}

export interface IProvideMessageScheduler {
    readonly IMessageScheduler: IMessageScheduler;
}

export interface IContainerContext extends EventEmitter, IMessageScheduler, IProvideMessageScheduler {
    readonly id: string;
    readonly existing: boolean | undefined;
    readonly options: any;
    readonly configuration: IComponentConfiguration;
    readonly clientId: string | undefined;
    readonly clientType: string | undefined;
    readonly clientDetails: IClientDetails;
    readonly parentBranch: string | undefined | null;
    readonly blobManager: IBlobManager | undefined;
    readonly storage: IDocumentStorageService | undefined | null;
    readonly connectionState: ConnectionState;
    readonly connected: boolean;
    readonly branch: string;
    readonly baseSnapshot: ISnapshotTree | null;
    readonly submitFn: (type: MessageType, contents: any, batch: boolean, appData?: any) => number;
    readonly submitSignalFn: (contents: any) => void;
    readonly snapshotFn: (message: string) => Promise<void>;
    readonly closeFn: () => void;
    readonly quorum: IQuorum;
    readonly audience: IAudience | undefined;
    readonly loader: ILoader;
    readonly codeLoader: ICodeLoader;
    readonly logger: ITelemetryLogger;
    readonly serviceConfiguration: IServiceConfiguration | undefined;
    readonly version: string;

    /**
     * Ambient services provided with the context
     */
    readonly scope: IComponent;

    error(err: any): void;
    requestSnapshot(tagMessage: string): Promise<void>;
    reloadContext(): Promise<void>;
    refreshBaseSummary(snapshot: ISnapshotTree): void;
}

export interface IProvideComponentTokenProvider {
    readonly IComponentTokenProvider: IComponentTokenProvider;
}

export interface IComponentTokenProvider extends IProvideComponentTokenProvider {
    intelligence: { [service: string]: any };
}

export interface IFluidModule {
    fluidExport: IComponent;
}

export interface IProvideRuntimeFactory {
    readonly IRuntimeFactory: IRuntimeFactory;
}
/**
 * Exported module definition
 */
export interface IRuntimeFactory extends IProvideRuntimeFactory {
    /**
     * Instantiates a new chaincode container
     */
    instantiateRuntime(context: IContainerContext): Promise<IRuntime>;
}

declare module "@microsoft/fluid-component-core-interfaces" {
    export interface IComponent extends Readonly<Partial<
        IProvideRuntimeFactory &
        IProvideComponentTokenProvider &
        IProvideMessageScheduler>> {
    }
}
