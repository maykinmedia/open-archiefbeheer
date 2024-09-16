class DeletionProcessingError(Exception):
    pass


class ZaakNotFound(Exception):
    pass


class ZaakArchiefactiedatumInFuture(Exception):
    pass


class NoReviewFoundError(Exception):
    pass


class PlannedDestructionDateInTheFuture(Exception):
    pass
