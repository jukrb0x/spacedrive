use crate::job::DynJob;

use std::{
	fmt::{Debug, Formatter},
	sync::Arc,
};
use tracing::warn;
use uuid::Uuid;

use crate::{api::CoreEvent, node::NodeConfigManager, prisma::PrismaClient, NodeContext};

use super::LibraryConfig;

/// LibraryContext holds context for a library which can be passed around the application.
#[derive(Clone)]
pub struct LibraryContext {
	/// id holds the ID of the current library.
	pub id: Uuid,
	/// config holds the configuration of the current library.
	pub config: LibraryConfig,
	/// db holds the database client for the current library.
	pub db: Arc<PrismaClient>,
	/// node_local_id holds the local ID of the node which is running the library.
	pub node_local_id: i32,
	/// node_context holds the node context for the node which this library is running on.
	pub(super) node_context: NodeContext,
}

impl Debug for LibraryContext {
	fn fmt(&self, f: &mut Formatter<'_>) -> std::fmt::Result {
		// Rolling out this implementation because `NodeContext` contains a DynJob which is
		// troublesome to implement Debug trait
		f.debug_struct("LibraryContext")
			.field("id", &self.id)
			.field("config", &self.config)
			.field("db", &self.db)
			.field("node_local_id", &self.node_local_id)
			.finish()
	}
}

impl LibraryContext {
	pub(crate) async fn spawn_job(&self, job: Box<dyn DynJob>) {
		self.node_context.jobs.clone().ingest(self, job).await;
	}

	pub(crate) async fn queue_job(&self, job: Box<dyn DynJob>) {
		self.node_context.jobs.ingest_queue(self, job).await;
	}

	pub(crate) fn emit(&self, event: CoreEvent) {
		match self.node_context.event_bus_tx.send(event) {
			Ok(_) => (),
			Err(err) => {
				warn!("Error sending event to event bus: {:?}", err);
			}
		}
	}

	pub(crate) fn config(&self) -> Arc<NodeConfigManager> {
		self.node_context.config.clone()
	}
}
