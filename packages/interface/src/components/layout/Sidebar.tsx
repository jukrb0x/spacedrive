import { CogIcon, LockClosedIcon, PhotoIcon } from '@heroicons/react/24/outline';
import { PlusIcon } from '@heroicons/react/24/solid';
import { useCurrentLibrary, useLibraryMutation, useLibraryQuery, usePlatform } from '@sd/client';
import { LocationCreateArgs } from '@sd/client';
import { Button, CategoryHeading, Dropdown, OverlayPanel } from '@sd/ui';
import clsx from 'clsx';
import { CheckCircle, CirclesFour, HandGrabbing, Planet } from 'phosphor-react';
import { PropsWithChildren } from 'react';
import { NavLink, NavLinkProps, useNavigate } from 'react-router-dom';

import { useOperatingSystem } from '../../hooks/useOperatingSystem';
import CreateLibraryDialog from '../dialog/CreateLibraryDialog';
import { Folder } from '../icons/Folder';
import { JobsManager } from '../jobs/JobManager';
import RunningJobsWidget from '../jobs/RunningJobsWidget';
import { MacTrafficLights } from '../os/TrafficLights';

export const SidebarLink = (props: PropsWithChildren<NavLinkProps>) => (
	<NavLink {...props}>
		{({ isActive }) => (
			<span
				className={clsx(
					'max-w mb-[2px] text-gray-550 dark:text-gray-300 rounded px-2 py-1 flex flex-row flex-grow items-center font-medium text-sm',
					{
						'!bg-gray-400 !bg-opacity-10 !text-white hover:bg-gray-400 dark:hover:bg-gray-400':
							isActive
					},
					props.className
				)}
			>
				{props.children}
			</span>
		)}
	</NavLink>
);

const Icon = ({ component: Icon, ...props }: any) => (
	<Icon weight="bold" {...props} className={clsx('w-4 h-4 mr-2', props.className)} />
);

// cute little helper to decrease code clutter
const macOnly = (platform: string | undefined, classnames: string) =>
	platform === 'macOS' ? classnames : '';

function WindowControls() {
	const { platform } = usePlatform();

	const showControls = window.location.search.includes('showControls');
	if (platform === 'tauri' || showControls) {
		return (
			<div data-tauri-drag-region className="flex-shrink-0 h-7">
				{/* We do not provide the onClick handlers for 'MacTrafficLights' because this is only used in demo mode */}
				{showControls && <MacTrafficLights className="z-50 absolute top-[13px] left-[13px]" />}
			</div>
		);
	}

	return null;
}

function LibraryScopedSection() {
	const os = useOperatingSystem();
	const platform = usePlatform();
	const { data: locations } = useLibraryQuery(['locations.list'], { keepPreviousData: true });
	const { data: tags } = useLibraryQuery(['tags.list'], { keepPreviousData: true });
	const { mutate: createLocation } = useLibraryMutation('locations.create');

	return (
		<>
			<div>
				<CategoryHeading className="mt-5">Locations</CategoryHeading>
				{locations?.map((location) => {
					return (
						<div key={location.id} className="flex flex-row items-center">
							<NavLink
								className="relative w-full group"
								to={{
									pathname: `location/${location.id}`
								}}
							>
								{({ isActive }) => (
									<span
										className={clsx(
											'max-w mb-[2px] text-gray-550 dark:text-gray-150 rounded px-2 py-1 gap-2 flex flex-row flex-grow items-center  truncate text-sm',
											{
												'!bg-gray-400 !bg-opacity-10 !text-white hover:bg-gray-400 dark:hover:bg-gray-400':
													isActive
											}
										)}
									>
										<div className="-mt-0.5 flex-grow-0 flex-shrink-0">
											{/* <Folder size={18} className={clsx(!isActive && 'hidden')} white /> */}
											<Folder size={18} />
										</div>

										<span className="flex-grow flex-shrink-0">{location.name}</span>
									</span>
								)}
							</NavLink>
						</div>
					);
				})}

				{(locations?.length || 0) < 1 && (
					<button
						onClick={() => {
							if (!platform.openFilePickerDialog) {
								// TODO: Support opening locations on web
								alert('Opening a dialogue is not supported on this platform!');
								return;
							}

							platform.openFilePickerDialog().then((result) => {
								// TODO: Pass indexer rules ids to create location
								if (result)
									createLocation({
										path: result as string,
										indexer_rules_ids: []
									} as LocationCreateArgs);
							});
						}}
						className={clsx(
							'w-full px-2 py-1.5 mt-1 text-xs font-bold text-center text-gray-400 border border-dashed rounded border-transparent cursor-normal border-gray-350 transition',
							os === 'macOS'
								? 'dark:text-gray-450 dark:border-gray-450 hover:dark:border-gray-400 dark:border-opacity-60'
								: 'dark:text-gray-450 dark:border-gray-550 hover:dark:border-gray-500'
						)}
					>
						Add Location
					</button>
				)}
			</div>
			{tags?.length ? (
				<div>
					<CategoryHeading className="mt-5">Tags</CategoryHeading>
					<div className="mb-2">
						{tags?.slice(0, 6).map((tag, index) => (
							<SidebarLink key={index} to={`tag/${tag.id}`} className="">
								<div
									className="w-[12px] h-[12px] rounded-full"
									style={{ backgroundColor: tag.color || '#efefef' }}
								/>
								<span className="ml-2 text-sm">{tag.name}</span>
							</SidebarLink>
						))}
					</div>
				</div>
			) : (
				<></>
			)}
		</>
	);
}

export function Sidebar() {
	const navigate = useNavigate();
	const os = useOperatingSystem();
	const { library, libraries, isLoading: isLoadingLibraries, switchLibrary } = useCurrentLibrary();

	return (
		<div
			className={clsx(
				'flex flex-col flex-grow-0 flex-shrink-0 w-48 min-h-full px-2.5 overflow-x-hidden overflow-y-scroll border-r border-gray-100 no-scrollbar bg-gray-50 dark:bg-gray-850 dark:border-gray-750',
				macOnly(os, 'dark:!bg-opacity-30')
			)}
		>
			<WindowControls />

			<Dropdown
				buttonProps={{
					justifyLeft: true,
					className: clsx(
						`flex w-full text-left max-w-full mb-1 mt-1 -mr-0.5 shadow-xs rounded !bg-gray-50 border-gray-150 hover:!bg-gray-1000 dark:!bg-gray-500 dark:hover:!bg-gray-500 dark:!border-gray-550 dark:hover:!border-gray-500`,
						macOnly(
							os,
							'dark:!bg-opacity-40 dark:hover:!bg-opacity-70 dark:!border-[#333949] dark:hover:!border-[#394052]'
						)
					),
					variant: 'gray'
				}}
				// to support the transparent sidebar on macOS we use slightly adjusted styles
				itemsClassName={macOnly(os, 'dark:bg-gray-800	dark:divide-gray-600')}
				itemButtonClassName={macOnly(os, 'dark:hover:bg-gray-550 dark:hover:bg-opacity-50')}
				// this shouldn't default to "My Library", it is only this way for landing demo
				buttonText={isLoadingLibraries ? 'Loading...' : library ? library.config.name : ' '}
				buttonTextClassName={library === null || isLoadingLibraries ? 'text-gray-300' : undefined}
				items={[
					libraries?.map((lib) => ({
						name: lib.config.name,
						selected: lib.uuid === library?.uuid,
						onPress: () => switchLibrary(lib.uuid)
					})) || [],
					[
						{
							name: 'Library Settings',
							icon: CogIcon,
							to: 'settings/library'
						},
						{
							name: 'Add Library',
							icon: PlusIcon,
							wrapItemComponent: CreateLibraryDialog
						},
						{
							name: 'Lock',
							icon: LockClosedIcon,
							disabled: true,
							onPress: () => {
								alert('TODO: Not implemented yet!');
							}
						}
					]
				]}
			/>
			<div className="pt-1">
				<SidebarLink to="/overview">
					<Icon component={Planet} />
					Overview
				</SidebarLink>
				<SidebarLink to="content">
					<Icon component={CirclesFour} />
					Spaces
				</SidebarLink>
				<SidebarLink to="drop">
					<HandGrabbing className="w-4 h-4 mr-2" />
					Spacedrop
				</SidebarLink>
			</div>

			{library && <LibraryScopedSection />}

			<div className="flex-grow" />

			{library && <RunningJobsWidget />}

			<div className="mt-2 mb-2">
				<NavLink to="/settings/general">
					{({ isActive }) => (
						<Button
							noPadding
							variant={'default'}
							className={clsx('px-[4px] hover:!bg-opacity-20 mb-1')}
						>
							<CogIcon className="w-5 h-5" />
						</Button>
					)}
				</NavLink>
				<OverlayPanel
					className="focus:outline-none"
					transformOrigin="bottom left"
					disabled={!library}
					trigger={
						<Button
							noPadding
							className={clsx(
								'px-[4px] !outline-none hover:!bg-opacity-20 disabled:opacity-50 disabled:cursor-not-allowed'
							)}
						>
							<CheckCircle className="w-5 h-5" />
						</Button>
					}
				>
					<div className="block w-[500px] h-96">
						<JobsManager />
					</div>
				</OverlayPanel>
			</div>
		</div>
	);
}
