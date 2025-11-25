class DeletionProcessingError(Exception):
    pass


class ZaakNotFoundError(Exception):
    pass


class ZaakArchiefactiedatumInFutureError(Exception):
    pass


class NoReviewFoundError(Exception):
    pass


class PlannedDestructionDateInTheFutureError(Exception):
    pass
