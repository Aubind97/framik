export async function load({ parent, fetch }) {
	const { queryClient, session } = await parent();

	if (session.activeOrganizationId) {
		const organizationId = session.activeOrganizationId;
		await queryClient.prefetchQuery({
			queryKey: ["frames", organizationId],
			queryFn: async () => (await fetch(`/api/frames?organizationId=${organizationId}`)).json(),
		});
	}
}
