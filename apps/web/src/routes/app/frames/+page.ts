import { getAllFramesQueryOptions } from "$lib/api/fetch/frame.js";

export async function load({ parent, fetch }) {
	const { queryClient, session } = await parent();

	if (session.activeOrganizationId) {
		const organizationId = session.activeOrganizationId;
		await queryClient.prefetchQuery(getAllFramesQueryOptions({ organizationId }, fetch));
	}
}
